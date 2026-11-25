import { Injectable } from "@nestjs/common";
import type { Challenge, FaceFacts, IdFields, LivenessFacts } from "../decision";
import type { IdentityProvider } from "./identity-provider";

/**
 * Local-development stand-in used when IDENTITY_PROVIDER=mock (or AWS isn't configured and
 * NODE_ENV != production). It performs NO real OCR or face matching — it exists so the
 * whole flow can be exercised without AWS credentials. Refused in production.
 *
 * Knobs: IDENTITY_MOCK_SIMILARITY (default 95), IDENTITY_MOCK_DOB (default 1995-06-15),
 * IDENTITY_MOCK_LIVENESS=fail to force a liveness rejection.
 */
@Injectable()
export class MockIdentityProvider implements IdentityProvider {
  async analyzeId(_front: Buffer): Promise<IdFields> {
    const year = new Date().getUTCFullYear() + 3;
    return {
      firstName: "Test",
      lastName: "User",
      dob: process.env.IDENTITY_MOCK_DOB || "1995-06-15",
      expiry: `${year}-01-01`,
      docType: "DRIVER LICENSE FRONT",
    };
  }

  async compareFaces(): Promise<FaceFacts> {
    const sim = Number(process.env.IDENTITY_MOCK_SIMILARITY ?? 95);
    return { idFaceFound: true, selfieToIdSimilarity: sim, selfieToSelfieSimilarity: sim };
  }

  async assessLiveness(_a: Buffer, _b: Buffer, _c: Challenge): Promise<LivenessFacts> {
    return process.env.IDENTITY_MOCK_LIVENESS === "fail"
      ? { passed: false, reason: "Mock liveness failure." }
      : { passed: true };
  }
}
