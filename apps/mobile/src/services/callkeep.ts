import RNCallKeep from "react-native-callkeep";
import { Platform } from "react-native";

export async function setupCallKeep() {
  await RNCallKeep.setup({
    ios: {
      appName: "DateBuk",
      supportsVideo: true,
      maximumCallGroups: "1",
      maximumCallsPerCallGroup: "1",
    },
    android: {
      alertTitle: "Phone account permission",
      alertDescription: "DateBuk needs permission to display calls.",
      cancelButton: "Cancel",
      okButton: "OK",
      additionalPermissions: [],
      selfManaged: true,
      foregroundService: {
        channelId: "datebuk-calls",
        channelName: "DateBuk calls",
        notificationTitle: "DateBuk call in progress",
        notificationIcon: "mipmap/ic_launcher",
      },
    },
  });

  if (Platform.OS === "android") {
    await RNCallKeep.setAvailable(true);
  }
}

export function displayIncomingNativeCall(
  callId: string,
  callerName: string,
  hasVideo: boolean
) {
  RNCallKeep.displayIncomingCall(callId, callerName, callerName, "generic", hasVideo);
}

export function endNativeCall(callId: string) {
  RNCallKeep.endCall(callId);
}
