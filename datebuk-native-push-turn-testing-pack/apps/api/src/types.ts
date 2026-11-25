export type DevicePlatform = "IOS" | "ANDROID";

export type RegisteredDevice = {
  id: string;
  userId: string;
  platform: DevicePlatform;
  token: string;
  enabled: boolean;
};

export type IncomingCallPayload = {
  callId: string;
  callerId: string;
  callerName: string;
  callType: "VOICE" | "VIDEO";
  expiresAt: string;
};
