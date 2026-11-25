/**
 * Pure accept/reject logic for ID + selfie verification. No I/O, so it is unit-testable
 * without AWS/Twilio. Providers (see providers/) extract the facts; this decides.
 */

export const MIN_AGE = 18;
/** Rekognition CompareFaces similarity (0-100) required between selfie and ID photo. */
export const DEFAULT_FACE_THRESHOLD = 90;

export type Challenge = "TURN_HEAD" | "SMILE";

export interface IdFields {
  firstName?: string | null;
  lastName?: string | null;
  /** ISO date yyyy-mm-dd */
  dob?: string | null;
  /** ISO date yyyy-mm-dd */
  expiry?: string | null;
  docType?: string | null;
}

export interface FaceFacts {
  /** A face was found on the ID photo. */
  idFaceFound: boolean;
  /** Selfie (neutral) vs ID photo similarity, 0-100; null when no match was returned. */
  selfieToIdSimilarity: number | null;
  /** Neutral selfie vs challenge selfie similarity, 0-100; null when no match. */
  selfieToSelfieSimilarity: number | null;
}

export interface LivenessFacts {
  passed: boolean;
  reason?: string;
}

export interface AccountFacts {
  dateOfBirth?: Date | null;
  fullName?: string | null;
}

export interface DecisionInput {
  id: IdFields;
  face: FaceFacts;
  liveness: LivenessFacts;
  account: AccountFacts;
  now?: Date;
  faceThreshold?: number;
  /** Reject when fullName is on the account and does not match the ID. Off by default. */
  requireNameMatch?: boolean;
}

export interface Decision {
  approved: boolean;
  /** Human-safe reasons (shown to the user). Never include document data. */
  reasons: string[];
  checks: {
    docExpired: boolean | null;
    ageOk: boolean | null;
    dobMatches: boolean | null;
    nameMatches: boolean | null;
    livenessPassed: boolean;
    faceSimilarity: number | null;
  };
}

function parseIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function ageOn(dob: Date, now: Date): number {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const before =
    now.getUTCMonth() < dob.getUTCMonth() ||
    (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate());
  if (before) age -= 1;
  return age;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function normName(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** True when every name part on the account appears among the ID's name parts. */
export function namesMatch(accountFullName: string, first?: string | null, last?: string | null): boolean {
  const idParts = new Set(normName(`${first ?? ""} ${last ?? ""}`));
  const acct = normName(accountFullName);
  if (acct.length === 0 || idParts.size === 0) return false;
  return acct.every((p) => idParts.has(p));
}

export function decide(input: DecisionInput): Decision {
  const now = input.now ?? new Date();
  const threshold = input.faceThreshold ?? DEFAULT_FACE_THRESHOLD;
  const reasons: string[] = [];

  const dob = parseIsoDate(input.id.dob);
  const expiry = parseIsoDate(input.id.expiry);

  let ageOk: boolean | null = null;
  if (!dob) {
    reasons.push("We couldn't read the date of birth on your ID. Retake a clear, well-lit photo of the front.");
  } else {
    ageOk = ageOn(dob, now) >= MIN_AGE;
    if (!ageOk) reasons.push(`You must be at least ${MIN_AGE} years old.`);
  }

  let docExpired: boolean | null = null;
  if (!expiry) {
    reasons.push("We couldn't read the expiry date on your ID.");
  } else {
    docExpired = expiry.getTime() < Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    if (docExpired) reasons.push("This ID has expired.");
  }

  let dobMatches: boolean | null = null;
  if (dob && input.account.dateOfBirth) {
    dobMatches = sameDay(dob, input.account.dateOfBirth);
    if (!dobMatches) reasons.push("The date of birth on your ID doesn't match your account.");
  }

  let nameMatches: boolean | null = null;
  if (input.account.fullName?.trim()) {
    nameMatches = namesMatch(input.account.fullName, input.id.firstName, input.id.lastName);
    if (!nameMatches && input.requireNameMatch) reasons.push("The name on your ID doesn't match your account.");
  }

  if (!input.liveness.passed) {
    reasons.push(
      input.liveness.reason || "We couldn't confirm a live person. Follow the on-screen prompt and try again.",
    );
  }

  if (!input.face.idFaceFound) {
    reasons.push("We couldn't find a face on your ID photo. Make sure the whole front of the ID is visible.");
  } else if (input.face.selfieToIdSimilarity == null || input.face.selfieToIdSimilarity < threshold) {
    reasons.push("Your selfie doesn't match the photo on your ID.");
  }
  if (input.face.selfieToSelfieSimilarity == null || input.face.selfieToSelfieSimilarity < threshold) {
    reasons.push("Your two selfies don't appear to be the same person.");
  }

  return {
    approved: reasons.length === 0,
    reasons,
    checks: {
      docExpired,
      ageOk,
      dobMatches,
      nameMatches,
      livenessPassed: input.liveness.passed,
      faceSimilarity: input.face.selfieToIdSimilarity,
    },
  };
}
