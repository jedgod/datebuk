import RNCallKeep from "react-native-callkeep";
import { Platform } from "react-native";

export async function setupNativeCalling() {
  await RNCallKeep.setup({
    ios: {
      appName: "DateBuk",
      supportsVideo: true,
      maximumCallGroups: "1",
      maximumCallsPerCallGroup: "1"
    },
    android: {
      alertTitle: "Phone account permission",
      alertDescription: "DateBuk needs permission to show incoming calls.",
      cancelButton: "Cancel",
      okButton: "Continue",
      additionalPermissions: [],
      selfManaged: false
    }
  });

  RNCallKeep.setAvailable(true);
}

export function showIncomingCall(input: {
  callId: string;
  callerName: string;
  callerHandle: string;
  video: boolean;
}) {
  RNCallKeep.displayIncomingCall(
    input.callId,
    input.callerHandle,
    input.callerName,
    "generic",
    input.video
  );
}

export function endNativeCall(callId: string) {
  RNCallKeep.endCall(callId);
}
