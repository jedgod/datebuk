import { Injectable } from "@nestjs/common";
import { TextractClient, AnalyzeIDCommand } from "@aws-sdk/client-textract";
import {
  RekognitionClient,
  CompareFacesCommand,
  DetectFacesCommand,
  type FaceDetail,
} from "@aws-sdk/client-rekognition";
import type { Challenge, FaceFacts, IdFields, LivenessFacts } from "../decision";
import type { IdentityProvider } from "./identity-provider";

export function awsIdentityConfigured(): boolean {
  const region = process.env.AWS_REGION || process.env.S3_REGION;
  const key = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secret = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
  // Credentials may also come from the instance/task role, so a region alone is enough
  // when no key pair is set.
  return !!region && (!!key === !!secret);
}

function awsConfig() {
  const region = process.env.AWS_REGION || process.env.S3_REGION;
  const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID)?.trim();
  const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY)?.trim();
  return {
    region,
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  };
}

type TextractField = { ValueDetection?: { Text?: string; NormalizedValue?: { Value?: string } } };

function isoDate(field?: TextractField): string | null {
  const normalized = field?.ValueDetection?.NormalizedValue?.Value;
  if (normalized && /^\d{4}-\d{2}-\d{2}/.test(normalized)) return normalized.slice(0, 10);
  const text = field?.ValueDetection?.Text?.trim();
  if (!text) return null;
  const us = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  if (us) return `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  const iso = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(text);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  return null;
}

/** AWS Textract (ID OCR) + Rekognition (face match, face attributes). Images stay in memory. */
@Injectable()
export class AwsIdentityProvider implements IdentityProvider {
  private textract = new TextractClient(awsConfig());
  private rekognition = new RekognitionClient(awsConfig());

  async analyzeId(front: Buffer): Promise<IdFields> {
    const out = await this.textract.send(new AnalyzeIDCommand({ DocumentPages: [{ Bytes: front }] }));
    const fields = out.IdentityDocuments?.[0]?.IdentityDocumentFields ?? [];
    const get = (type: string) => fields.find((f) => f.Type?.Text === type);
    return {
      firstName: get("FIRST_NAME")?.ValueDetection?.Text ?? null,
      lastName: get("LAST_NAME")?.ValueDetection?.Text ?? null,
      dob: isoDate(get("DATE_OF_BIRTH")),
      expiry: isoDate(get("EXPIRATION_DATE")),
      docType: get("ID_TYPE")?.ValueDetection?.Text ?? null,
    };
  }

  private async similarity(
    source: Buffer,
    target: Buffer,
  ): Promise<{ similarity: number | null; targetFaceFound: boolean }> {
    try {
      const out = await this.rekognition.send(
        new CompareFacesCommand({
          SourceImage: { Bytes: source },
          TargetImage: { Bytes: target },
          SimilarityThreshold: 1,
          QualityFilter: "AUTO",
        }),
      );
      const best = (out.FaceMatches ?? []).reduce<number | null>(
        (m, f) => Math.max(m ?? 0, f.Similarity ?? 0),
        null,
      );
      const targetFaceFound = (out.FaceMatches?.length ?? 0) + (out.UnmatchedFaces?.length ?? 0) > 0;
      return { similarity: best, targetFaceFound };
    } catch (err: any) {
      // InvalidParameterException: no face detected in the source or target image.
      if (err?.name === "InvalidParameterException") return { similarity: null, targetFaceFound: false };
      throw err;
    }
  }

  async compareFaces(selfie: Buffer, idFront: Buffer, challengeSelfie: Buffer): Promise<FaceFacts> {
    const [toId, toSelfie] = await Promise.all([
      this.similarity(selfie, idFront),
      this.similarity(selfie, challengeSelfie),
    ]);
    return {
      idFaceFound: toId.targetFaceFound,
      selfieToIdSimilarity: toId.similarity,
      selfieToSelfieSimilarity: toSelfie.similarity,
    };
  }

  private async detect(image: Buffer): Promise<FaceDetail[]> {
    const out = await this.rekognition.send(new DetectFacesCommand({ Image: { Bytes: image }, Attributes: ["ALL"] }));
    return out.FaceDetails ?? [];
  }

  private static unclear(face: FaceDetail): string | null {
    if ((face.Confidence ?? 0) < 90) return "We couldn't see your face clearly.";
    if ((face.Quality?.Brightness ?? 100) < 25) return "Your selfie is too dark.";
    if ((face.Quality?.Sharpness ?? 100) < 25) return "Your selfie is blurry.";
    if (face.Sunglasses?.Value && (face.Sunglasses.Confidence ?? 0) > 80) return "Take off sunglasses and try again.";
    if (face.EyesOpen && !face.EyesOpen.Value && (face.EyesOpen.Confidence ?? 0) > 80) return "Keep your eyes open.";
    return null;
  }

  async assessLiveness(selfie: Buffer, challengeSelfie: Buffer, challenge: Challenge): Promise<LivenessFacts> {
    const [neutral, active] = await Promise.all([this.detect(selfie), this.detect(challengeSelfie)]);
    if (neutral.length !== 1 || active.length !== 1) {
      return { passed: false, reason: "Exactly one face must be visible in each selfie." };
    }
    const bad = AwsIdentityProvider.unclear(neutral[0]) || AwsIdentityProvider.unclear(active[0]);
    if (bad) return { passed: false, reason: bad };

    if (Math.abs(neutral[0].Pose?.Yaw ?? 0) > 20) {
      return { passed: false, reason: "Look straight at the camera for the first selfie." };
    }
    if (challenge === "TURN_HEAD") {
      if (Math.abs(active[0].Pose?.Yaw ?? 0) < 20) {
        return { passed: false, reason: "Turn your head to one side for the second selfie." };
      }
    } else if (!(active[0].Smile?.Value && (active[0].Smile.Confidence ?? 0) >= 80)) {
      return { passed: false, reason: "Smile for the second selfie." };
    }
    return { passed: true };
  }
}
