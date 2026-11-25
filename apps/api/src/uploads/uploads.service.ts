import { Injectable, BadRequestException } from "@nestjs/common";
import { S3Client, PutObjectCommand, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { scanBufferWithClamAV } from "../common/security/clamav";

export type UploadKind = "image" | "video" | "audio";

type PresignRequest = {
  contentType: string;
  kind?: UploadKind;
  fileName?: string;
  sizeBytes?: number;
};

const UPLOAD_RULES: Record<UploadKind, { contentTypes: Set<string>; maxBytes: number }> = {
  image: {
    contentTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    maxBytes: 8 * 1024 * 1024,
  },
  video: {
    contentTypes: new Set(["video/mp4", "video/quicktime", "video/webm"]),
    maxBytes: 100 * 1024 * 1024,
  },
  audio: {
    contentTypes: new Set(["audio/aac", "audio/m4a", "audio/mp4", "audio/mpeg", "audio/wav", "audio/webm"]),
    maxBytes: 25 * 1024 * 1024,
  },
};

const CONTENT_TYPE_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "audio/aac": "aac",
  "audio/m4a": "m4a",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/webm": "webm",
};

function assertConfigured(value: string | undefined, name: string) {
  if (!value) throw new BadRequestException(`${name} missing`);
  return value;
}

@Injectable()
export class UploadsService {
  private client(): S3Client {
    const region = assertConfigured(process.env.S3_REGION, "S3_REGION");
    const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
    if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
      throw new BadRequestException("S3 credentials must be configured as a pair");
    }
    return new S3Client({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  }

  async headObject(key: string) {
    const bucket = assertConfigured(process.env.S3_BUCKET, "S3_BUCKET");
    const s3 = this.client();
    return s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  }

  async presignedGet(key: string, expiresIn: number) {
    const bucket = assertConfigured(process.env.S3_BUCKET, "S3_BUCKET");
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.client(), cmd, { expiresIn });
  }

  async listObjects(prefix: string) {
    const bucket = assertConfigured(process.env.S3_BUCKET, "S3_BUCKET");
    const s3 = this.client();
    return s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
  }

  async deleteObject(key: string) {
    const bucket = assertConfigured(process.env.S3_BUCKET, "S3_BUCKET");
    const s3 = this.client();
    return s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  async copyObject(sourceKey: string, destKey: string) {
    const bucket = assertConfigured(process.env.S3_BUCKET, "S3_BUCKET");
    const s3 = this.client();
    return s3.send(new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `/${bucket}/${sourceKey}`,
      Key: destKey,
    }));
  }

  private assertOwnedKey(userId: string, key: string) {
    if (!key || !key.startsWith(`private/${userId}/`)) {
      throw new BadRequestException("Invalid upload key");
    }
  }

  private kindFromKey(userId: string, key: string): UploadKind {
    this.assertOwnedKey(userId, key);
    const kind = key.split("/")[2] as UploadKind;
    if (!UPLOAD_RULES[kind]) throw new BadRequestException("Invalid upload kind");
    return kind;
  }

  async createPresignedUpload(userId: string, request: PresignRequest) {
    const bucket = assertConfigured(process.env.S3_BUCKET, "S3_BUCKET");
    const kind = request.kind ?? "image";
    const rules = UPLOAD_RULES[kind];
    if (!rules || !rules.contentTypes.has(request.contentType)) {
      throw new BadRequestException("Unsupported content type");
    }
    if (request.sizeBytes != null && (!Number.isSafeInteger(request.sizeBytes) || request.sizeBytes <= 0 || request.sizeBytes > rules.maxBytes)) {
      throw new BadRequestException(`File exceeds ${rules.maxBytes} byte limit`);
    }

    const extension = CONTENT_TYPE_EXTENSION[request.contentType];
    const key = `private/${userId}/${kind}/${Date.now()}-${nanoid(10)}.${extension}`;
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: request.contentType,
      ServerSideEncryption: "AES256",
      Metadata: {
        "owner-id": userId,
        "upload-kind": kind,
        "original-name": (request.fileName || "capture").replace(/[^\w.-]/g, "_").slice(0, 120),
      },
    });

    const url = await getSignedUrl(this.client(), cmd, { expiresIn: 60 });
    return { url, key, kind, expiresIn: 60, maxBytes: rules.maxBytes };
  }

  async completeUpload(userId: string, key: string) {
    const kind = this.kindFromKey(userId, key);
    const metadata = await this.headObject(key);
    const contentType = metadata.ContentType || "";
    const sizeBytes = metadata.ContentLength || 0;
    const rules = UPLOAD_RULES[kind];
    if (!rules.contentTypes.has(contentType) || sizeBytes <= 0 || sizeBytes > rules.maxBytes) {
      await this.deleteObject(key);
      throw new BadRequestException("Uploaded object failed validation");
    }
    if (metadata.Metadata?.["owner-id"] !== userId || metadata.Metadata?.["upload-kind"] !== kind) {
      await this.deleteObject(key);
      throw new BadRequestException("Uploaded object metadata is invalid");
    }
    return { ok: true, key, kind, contentType, sizeBytes };
  }

  async createPrivateDownload(userId: string, key: string) {
    this.assertOwnedKey(userId, key);
    await this.headObject(key);
    return { url: await this.presignedGet(key, 300), expiresIn: 300 };
  }

  async assertUploadOwnedBy(userId: string, key: string) {
    this.assertOwnedKey(userId, key);
    const metadata = await this.headObject(key);
    if (metadata.Metadata?.["owner-id"] !== userId) {
      throw new BadRequestException("Attachment ownership validation failed");
    }
  }

private async quarantineObject(bucket: string, key: string, reason: string) {
  const s3 = this.client();
  const qKey = key.replace(/^uploads\//, "quarantine/") + `.quarantine`;
  // Copy into quarantine (private by default since ACL not set)
  await s3.send(new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `/${bucket}/${key}`,
    Key: qKey,
    MetadataDirective: "REPLACE",
    Metadata: { reason: reason.slice(0, 512) },
  }));
  // Delete original
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  return { quarantinedKey: qKey };
}

  // Production pipeline: download -> scan -> normalize -> create variants -> upload
  async processImage(key: string) {
    const bucket = assertConfigured(process.env.S3_BUCKET, "S3_BUCKET");
    const s3 = this.client();

    // Download
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = obj.Body;
    if (!body || typeof (body as any).transformToByteArray !== "function") {
      throw new BadRequestException("Unsupported runtime stream for S3 download");
    }
    const bytes: Uint8Array = await (body as any).transformToByteArray();

    // Basic "scanner" hardening:
    // - Size cap
    const maxBytes = 8 * 1024 * 1024;
    if (bytes.byteLength > maxBytes) throw new BadRequestException("File too large");

    // Virus scan (ClamAV) – recommended in production
    const scan = await scanBufferWithClamAV(Buffer.from(bytes));
    if (!scan.ok) {
      const reason = 'reason' in scan ? scan.reason : 'Virus detected';
      await this.quarantineObject(bucket, key, reason);
      throw new BadRequestException(`Virus detected and quarantined: ${reason}`);
    }

    // Decode and strip metadata by re-encoding with sharp
    const base = sharp(Buffer.from(bytes), { failOn: "warning" }).rotate();

    const metadata = await base.metadata();
    if (!metadata.width || !metadata.height) throw new BadRequestException("Invalid image");

    // Create variants
    const variants = [
      { suffix: "thumb", w: 256 },
      { suffix: "medium", w: 720 },
      { suffix: "large", w: 1280 },
    ];

    const uploads = [];
    for (const v of variants) {
      const outKey = key.replace(/^uploads\//, "images/") + `.${v.suffix}.webp`;
      const buf = await base.resize({ width: v.w, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();

      // Upload variant
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: outKey,
        ContentType: "image/webp",
        ServerSideEncryption: "AES256",
        Body: buf,
      }));

      uploads.push(outKey);
    }

    return { ok: true, key, variants: uploads };
  }
}
