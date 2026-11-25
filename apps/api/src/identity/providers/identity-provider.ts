import type { Challenge, FaceFacts, IdFields, LivenessFacts } from "../decision";

export interface IdentityProvider {
  /** OCR the front of a government ID. */
  analyzeId(front: Buffer): Promise<IdFields>;
  /** Compare the neutral selfie to the ID photo, and to the challenge selfie. */
  compareFaces(selfie: Buffer, idFront: Buffer, challengeSelfie: Buffer): Promise<FaceFacts>;
  /** Check both selfies show one real, clear face and the requested challenge was performed. */
  assessLiveness(selfie: Buffer, challengeSelfie: Buffer, challenge: Challenge): Promise<LivenessFacts>;
}

export const IDENTITY_PROVIDER = Symbol("IDENTITY_PROVIDER");
