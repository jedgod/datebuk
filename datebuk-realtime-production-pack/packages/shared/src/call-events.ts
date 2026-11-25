export type CallType = "VOICE" | "VIDEO";

export type CallStatus =
  | "RINGING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "MISSED"
  | "ENDED"
  | "FAILED";

export type IncomingCallEvent = {
  callId: string;
  callerId: string;
  callerName: string;
  type: CallType;
};

export type SignalingEnvelope<T> = {
  peerId: string;
  callId: string;
  data: T;
};
