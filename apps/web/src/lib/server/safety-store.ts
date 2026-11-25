import { readJsonStore, writeJsonStore } from "./persistent-json";

export type VerificationRecord = {
  id: string;
  userId: string;
  documentType: string;
  legalName: string;
  dateOfBirth: string;
  country: string;
  selfieStatus: string;
  addressStatus: string;
  reviewStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type BlockedMemberRecord = {
  id: string;
  userId: string;
  memberName: string;
  reason: string;
  scopes: string[];
  createdAt: string;
};

export type PrivacySettingsRecord = {
  userId: string;
  visibility: string;
  messages: string;
  locationSharing: string;
  dataSharing: boolean;
  readReceipts: boolean;
  screenshotAlerts: boolean;
  updatedAt: string;
};

const verificationStore = new Map(
  readJsonStore<VerificationRecord[]>("safety-verifications", []).map((record) => [record.userId, record])
);
const blockedMembersStore = new Map(
  readJsonStore<[string, BlockedMemberRecord[]][]>("safety-blocks", [])
);
const privacySettingsStore = new Map(
  readJsonStore<PrivacySettingsRecord[]>("safety-privacy", []).map((record) => [record.userId, record])
);

function saveVerifications(): void {
  writeJsonStore("safety-verifications", Array.from(verificationStore.values()));
}

function saveBlockedMembers(): void {
  writeJsonStore("safety-blocks", Array.from(blockedMembersStore.entries()));
}

function savePrivacySettingsStore(): void {
  writeJsonStore("safety-privacy", Array.from(privacySettingsStore.values()));
}

function nowIso(): string {
  return new Date().toISOString();
}

export function upsertVerification(input: {
  userId: string;
  documentType: string;
  legalName: string;
  dateOfBirth: string;
  country: string;
}): VerificationRecord {
  const existing = verificationStore.get(input.userId);
  const updatedAt = nowIso();
  const record: VerificationRecord = {
    id: existing?.id ?? `ver_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: input.userId,
    documentType: input.documentType,
    legalName: input.legalName,
    dateOfBirth: input.dateOfBirth,
    country: input.country,
    selfieStatus: "Selfie matched",
    addressStatus: "Address proof uploaded",
    reviewStatus: "Submitted for manual review",
    createdAt: existing?.createdAt ?? updatedAt,
    updatedAt,
  };
  verificationStore.set(input.userId, record);
  saveVerifications();
  return record;
}

export function getVerification(userId: string): VerificationRecord | null {
  return verificationStore.get(userId) ?? null;
}

export function addBlockedMember(input: {
  userId: string;
  memberName: string;
  reason: string;
  scopes: string[];
}): BlockedMemberRecord {
  const record: BlockedMemberRecord = {
    id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: input.userId,
    memberName: input.memberName,
    reason: input.reason,
    scopes: input.scopes,
    createdAt: nowIso(),
  };
  const current = blockedMembersStore.get(input.userId) ?? [];
  blockedMembersStore.set(input.userId, [record, ...current]);
  saveBlockedMembers();
  return record;
}

export function listBlockedMembers(userId: string): BlockedMemberRecord[] {
  return blockedMembersStore.get(userId) ?? [];
}

export function removeBlockedMember(userId: string, blockId: string): boolean {
  const current = blockedMembersStore.get(userId) ?? [];
  const next = current.filter((item) => item.id !== blockId);
  blockedMembersStore.set(userId, next);
  saveBlockedMembers();
  return next.length !== current.length;
}

export function getPrivacySettings(userId: string): PrivacySettingsRecord {
  const existing = privacySettingsStore.get(userId);
  if (existing) return existing;

  return {
    userId,
    visibility: "Verified members only",
    messages: "Matches only",
    locationSharing: "Approximate city",
    dataSharing: false,
    readReceipts: true,
    screenshotAlerts: true,
    updatedAt: nowIso(),
  };
}

export function savePrivacySettings(input: Omit<PrivacySettingsRecord, "updatedAt">): PrivacySettingsRecord {
  const record = {
    ...input,
    updatedAt: nowIso(),
  };
  privacySettingsStore.set(input.userId, record);
  savePrivacySettingsStore();
  return record;
}
