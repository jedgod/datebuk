import { readJsonStore, writeJsonStore } from "./persistent-json";

type OtherUser = {
  id: string;
  displayName: string;
  avatar?: string;
  age?: number;
  location?: string;
  bio?: string;
};

export type MatchRecord = {
  id: string;
  userId: string;
  matchedUserId: string;
  matchedUserName: string;
  matchedUserAge?: number;
  matchedUserLocation?: string;
  matchedUserBio?: string;
  matchedAt: string;
  createdAt: string;
  lastMessageAt?: string;
  unreadCount?: number;
  otherUser: OtherUser;
};

export type MessageAttachment = {
  key: string;
  url: string;
  contentType: string;
  name?: string;
  size?: number;
};

export type MessageRecord = {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  attachments?: MessageAttachment[];
  createdAt: string;
  deliveredAt?: string | null;
  readAt?: string | null;
};

export type CallDirection = "incoming" | "outgoing";
export type CallType = "voice" | "video";
export type CallStatus = "initiated" | "ringing" | "connected" | "missed" | "ended" | "rejected";

export type CallLogRecord = {
  id: string;
  matchId: string;
  sessionId?: string;
  roomId?: string;
  actorUserId: string;
  peerUserId?: string;
  direction: CallDirection;
  callType: CallType;
  status: CallStatus;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  qualityScore?: number;
  notes?: string;
};

export type NetworkPolicy = {
  action: "allow" | "warn" | "restrict" | "block";
  message: string;
  restrictions: string[];
  riskScore: number;
  flags: string[];
  isVPN: boolean;
  ipAddress: string;
  maskedIp: string;
};

export type VideoSessionRecord = {
  id: string;
  roomId: string;
  matchId: string;
  userId: string;
  callType: CallType;
  scheduledTime: string;
  timezone: string;
  duration: number;
  status: "scheduled" | "ready" | "active" | "ended" | "cancelled";
  createdAt: string;
  expiresAt?: string;
  participants: string[];
  networkPolicy: NetworkPolicy;
  ipShare: {
    automaticEnabled: boolean;
    sessionFingerprint: string;
  };
  datePlan?: {
    title?: string;
    placeName?: string;
    placeAddress?: string;
    latitude?: number;
    longitude?: number;
    mapUrl?: string;
    notes?: string;
  };
};

export type LocationShareRecord = {
  id: string;
  sessionId: string;
  userId: string;
  location: {
    city: string;
    state: string;
    country: string;
    radiusMiles: number;
    approximate: boolean;
  };
  ipSnapshot: {
    maskedIp: string;
    networkFingerprint: string;
  };
  consentedAt: string;
  expiresAt: string;
};

export type DateRequestStatus = "pending" | "accepted" | "declined" | "rescheduled" | "cancelled" | "completed";

export type DateRequestRecord = {
  id: string;
  matchId: string;
  requestedByUserId: string;
  requestedToUserId: string;
  scheduledAt: string;
  timezone: string;
  placeName: string;
  placeAddress: string;
  latitude?: number;
  longitude?: number;
  mapUrl: string;
  notes?: string;
  status: DateRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type DateFeedbackRecord = {
  id: string;
  userId: string;
  matchId?: string;
  dateRequestId?: string;
  partnerUserId?: string;
  partnerName?: string;
  partnerAttitude: string;
  partnerReaction: string;
  comfortLevel: string;
  recommendedAction: string;
  notes: string;
  createdAt: string;
};

export type AvailabilitySlotRecord = {
  id: string;
  userId: string;
  date: string;
  slots: string[];
  timezone: string;
  updatedAt: string;
};

const seededUsers = [
  {
    id: "usr_2001",
    displayName: "Alex Johnson",
    age: 27,
    location: "Brooklyn, NY",
    bio: "Adventure seeker and coffee enthusiast",
  },
  {
    id: "usr_2002",
    displayName: "Jordan Lee",
    age: 29,
    location: "Manhattan, NY",
    bio: "Film maker and yoga instructor",
  },
  {
    id: "usr_2003",
    displayName: "Sam Rivera",
    age: 26,
    location: "Queens, NY",
    bio: "Artist and music lover",
  },
];

const matchesByUser = new Map<string, MatchRecord[]>();

const messagesStore: MessageRecord[] = [];
const callLogsStore: CallLogRecord[] = [];
const videoSessionsStore: VideoSessionRecord[] = [];
const locationShareStore: LocationShareRecord[] = [];
const dateRequestsStore = readJsonStore<DateRequestRecord[]>("date-requests", []);
const dateFeedbackStore = readJsonStore<DateFeedbackRecord[]>("date-feedback", []);
const availabilityStore = readJsonStore<AvailabilitySlotRecord[]>("availability-slots", []);

function saveDateRequests(): void {
  writeJsonStore("date-requests", dateRequestsStore);
}

function saveDateFeedback(): void {
  writeJsonStore("date-feedback", dateFeedbackStore);
}

function saveAvailability(): void {
  writeJsonStore("availability-slots", availabilityStore);
}

function nowIso(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function makeMapUrl(latitude?: number, longitude?: number, placeName?: string): string {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
  const label = (placeName || "Meeting Location").trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
}

function ensureMatches(userId: string): MatchRecord[] {
  const existing = matchesByUser.get(userId);
  if (existing) return existing;

  const seeded = seededUsers.map((other, idx) => {
    const createdAt = nowIso(-(idx + 2) * 24 * 60 * 60 * 1000);
    const matchId = `match_${String(idx + 1).padStart(3, "0")}`;
    return {
      id: matchId,
      userId,
      matchedUserId: other.id,
      matchedUserName: other.displayName,
      matchedUserAge: other.age,
      matchedUserLocation: other.location,
      matchedUserBio: other.bio,
      matchedAt: createdAt,
      createdAt,
      lastMessageAt: nowIso(-(idx + 1) * 60 * 60 * 1000),
      unreadCount: idx === 1 ? 2 : 0,
      otherUser: {
        id: other.id,
        displayName: other.displayName,
        age: other.age,
        location: other.location,
        bio: other.bio,
      },
    };
  });

  matchesByUser.set(userId, seeded);
  return seeded;
}

function ensureThreadSeed(matchId: string, userId: string) {
  const hasThread = messagesStore.some((item) => item.matchId === matchId);
  if (hasThread) return;

  const matches = ensureMatches(userId);
  const match = matches.find((item) => item.id === matchId);
  const peerId = match?.matchedUserId ?? "usr_peer";

  messagesStore.push(
    {
      id: `msg_${Date.now()}_1`,
      matchId,
      senderId: peerId,
      content: "Hey, good to connect. Want to plan a call this week?",
      createdAt: nowIso(-2 * 60 * 60 * 1000),
      deliveredAt: nowIso(-2 * 60 * 60 * 1000),
      readAt: nowIso(-2 * 60 * 60 * 1000),
    },
    {
      id: `msg_${Date.now()}_2`,
      matchId,
      senderId: userId,
      content: "Yes, that sounds good. I am free tomorrow evening.",
      createdAt: nowIso(-90 * 60 * 1000),
      deliveredAt: nowIso(-90 * 60 * 1000),
      readAt: nowIso(-85 * 60 * 1000),
    }
  );
}

export function getMatchesForUser(userId: string): MatchRecord[] {
  return ensureMatches(userId);
}

export function getMessagesForMatch(matchId: string, userId: string): MessageRecord[] {
  ensureThreadSeed(matchId, userId);
  return messagesStore
    .filter((item) => item.matchId === matchId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addMessage(input: {
  matchId: string;
  senderId: string;
  content: string;
  attachments?: MessageAttachment[];
}): MessageRecord {
  const createdAt = nowIso();
  const record: MessageRecord = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    matchId: input.matchId,
    senderId: input.senderId,
    content: input.content,
    attachments: input.attachments && input.attachments.length ? input.attachments : undefined,
    createdAt,
    deliveredAt: createdAt,
    readAt: null,
  };

  messagesStore.push(record);
  return record;
}

export function markMessagesRead(matchId: string, readerId: string): number {
  let updated = 0;
  for (const item of messagesStore) {
    if (item.matchId !== matchId) continue;
    if (item.senderId === readerId) continue;
    if (item.readAt) continue;
    item.readAt = nowIso();
    updated += 1;
  }
  return updated;
}

export function addVideoSession(session: VideoSessionRecord): VideoSessionRecord {
  videoSessionsStore.push(session);
  return session;
}

export function listVideoSessionsForUser(userId: string): VideoSessionRecord[] {
  return videoSessionsStore
    .filter((item) => item.participants.includes(userId))
    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
}

export function cancelVideoSession(sessionId: string, userId: string): boolean {
  const session = videoSessionsStore.find((item) => item.id === sessionId && item.participants.includes(userId));
  if (!session) return false;
  session.status = "cancelled";
  return true;
}

export function addCallLog(log: CallLogRecord): CallLogRecord {
  callLogsStore.push(log);
  return log;
}

export function listCallLogsForUser(userId: string, matchId?: string): CallLogRecord[] {
  return callLogsStore
    .filter((item) => item.actorUserId === userId || item.peerUserId === userId)
    .filter((item) => (matchId ? item.matchId === matchId : true))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function addLocationShare(share: LocationShareRecord): LocationShareRecord {
  locationShareStore.push(share);
  return share;
}

export function listLocationShares(sessionId: string): LocationShareRecord[] {
  return locationShareStore
    .filter((item) => item.sessionId === sessionId)
    .sort((a, b) => new Date(a.consentedAt).getTime() - new Date(b.consentedAt).getTime());
}

export function createDateRequest(input: {
  matchId: string;
  requestedByUserId: string;
  requestedToUserId: string;
  scheduledAt: string;
  timezone: string;
  placeName: string;
  placeAddress: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  notes?: string;
}): DateRequestRecord {
  const createdAt = nowIso();
  const request: DateRequestRecord = {
    id: `date_req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    matchId: input.matchId,
    requestedByUserId: input.requestedByUserId,
    requestedToUserId: input.requestedToUserId,
    scheduledAt: input.scheduledAt,
    timezone: input.timezone,
    placeName: input.placeName,
    placeAddress: input.placeAddress,
    latitude: input.latitude,
    longitude: input.longitude,
    mapUrl: input.mapUrl || makeMapUrl(input.latitude, input.longitude, input.placeName),
    notes: input.notes,
    status: "pending",
    createdAt,
    updatedAt: createdAt,
  };

  dateRequestsStore.push(request);
  messagesStore.push({
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    matchId: input.matchId,
    senderId: input.requestedByUserId,
    content: `Date invitation sent for ${new Date(input.scheduledAt).toLocaleString()} at ${input.placeName}.`,
    createdAt,
    deliveredAt: createdAt,
    readAt: null,
  });
  saveDateRequests();
  return request;
}

export function listDateRequestsForUser(userId: string): DateRequestRecord[] {
  return dateRequestsStore
    .filter((item) => item.requestedByUserId === userId || item.requestedToUserId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function updateDateRequest(
  id: string,
  actorUserId: string,
  patch: {
    status?: DateRequestStatus;
    scheduledAt?: string;
    timezone?: string;
    placeName?: string;
    placeAddress?: string;
    latitude?: number;
    longitude?: number;
    mapUrl?: string;
    notes?: string;
  }
): DateRequestRecord | null {
  const request = dateRequestsStore.find((item) => item.id === id);
  if (!request) return null;
  if (request.requestedByUserId !== actorUserId && request.requestedToUserId !== actorUserId) return null;

  const previousStatus = request.status;
  const previousSchedule = request.scheduledAt;
  const previousPlace = request.placeName;

  if (patch.status) request.status = patch.status;
  if (patch.scheduledAt) request.scheduledAt = patch.scheduledAt;
  if (patch.timezone) request.timezone = patch.timezone;
  if (patch.placeName) request.placeName = patch.placeName;
  if (patch.placeAddress) request.placeAddress = patch.placeAddress;
  if (typeof patch.latitude === "number") request.latitude = patch.latitude;
  if (typeof patch.longitude === "number") request.longitude = patch.longitude;
  if (patch.notes !== undefined) request.notes = patch.notes;

  request.mapUrl =
    patch.mapUrl ||
    makeMapUrl(request.latitude, request.longitude, request.placeName);
  request.updatedAt = nowIso();

  const systemNotes: string[] = [];
  if (patch.status && patch.status !== previousStatus) {
    systemNotes.push(`status changed to ${patch.status}`);
  }
  if (patch.scheduledAt && patch.scheduledAt !== previousSchedule) {
    systemNotes.push(`rescheduled to ${new Date(request.scheduledAt).toLocaleString()}`);
  }
  if ((patch.placeName && patch.placeName !== previousPlace) || patch.placeAddress) {
    systemNotes.push(`meeting point updated to ${request.placeName}`);
  }
  if (systemNotes.length > 0) {
    const createdAt = request.updatedAt;
    messagesStore.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      matchId: request.matchId,
      senderId: actorUserId,
      content: `Date request update: ${systemNotes.join("; ")}.`,
      createdAt,
      deliveredAt: createdAt,
      readAt: null,
    });
  }

  saveDateRequests();

  return request;
}

export function listAvailabilityForUser(userId: string): AvailabilitySlotRecord[] {
  return availabilityStore
    .filter((item) => item.userId === userId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function upsertAvailabilityForUser(
  userId: string,
  input: {
    date: string;
    slots: string[];
    timezone: string;
  }
): AvailabilitySlotRecord {
  const normalizedSlots = Array.from(new Set(input.slots)).sort();
  const existing = availabilityStore.find((item) => item.userId === userId && item.date === input.date);
  const updatedAt = nowIso();

  if (existing) {
    existing.slots = normalizedSlots;
    existing.timezone = input.timezone;
    existing.updatedAt = updatedAt;
    saveAvailability();
    return existing;
  }

  const created: AvailabilitySlotRecord = {
    id: `avail_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    date: input.date,
    slots: normalizedSlots,
    timezone: input.timezone,
    updatedAt,
  };
  availabilityStore.push(created);
  saveAvailability();
  return created;
}

export function listCalendarEventsForUser(userId: string): DateRequestRecord[] {
  return listDateRequestsForUser(userId).filter((item) => item.status !== "declined" && item.status !== "cancelled");
}

export function createDateFeedback(input: {
  userId: string;
  matchId?: string;
  dateRequestId?: string;
  partnerUserId?: string;
  partnerName?: string;
  partnerAttitude: string;
  partnerReaction: string;
  comfortLevel: string;
  recommendedAction: string;
  notes: string;
}): DateFeedbackRecord {
  const record: DateFeedbackRecord = {
    id: `date_fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: input.userId,
    matchId: input.matchId,
    dateRequestId: input.dateRequestId,
    partnerUserId: input.partnerUserId,
    partnerName: input.partnerName,
    partnerAttitude: input.partnerAttitude,
    partnerReaction: input.partnerReaction,
    comfortLevel: input.comfortLevel,
    recommendedAction: input.recommendedAction,
    notes: input.notes,
    createdAt: nowIso(),
  };

  dateFeedbackStore.push(record);
  saveDateFeedback();
  return record;
}

export function listDateFeedbackForUser(userId: string): DateFeedbackRecord[] {
  return dateFeedbackStore
    .filter((item) => item.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
