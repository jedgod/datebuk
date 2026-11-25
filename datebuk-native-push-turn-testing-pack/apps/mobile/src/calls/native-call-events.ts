import { NativeEventEmitter, NativeModules, Platform } from "react-native";
import RNCallKeep from "react-native-callkeep";
import { registerNativeCallToken } from "./register-token";

const { DateBukVoipPush } = NativeModules;

export async function initializeNativeCallDelivery(accessToken: string) {
  await RNCallKeep.setup({
    ios: {
      appName: "DateBuk",
      supportsVideo: true,
      maximumCallGroups: "1",
      maximumCallsPerCallGroup: "1"
    },
    android: {
      alertTitle: "Calling permission",
      alertDescription: "DateBuk requires permission to receive calls.",
      cancelButton: "Cancel",
      okButton: "Continue",
      additionalPermissions: []
    }
  });

  if (Platform.OS === "ios" && DateBukVoipPush) {
    const emitter = new NativeEventEmitter(DateBukVoipPush);

    emitter.addListener("voipToken", async ({ token }) => {
      await registerNativeCallToken(token, accessToken);
    });

    emitter.addListener("incomingVoipCall", payload => {
      // Navigation may be triggered here after CallKit displays the call.
      console.log("Incoming iOS VoIP call", payload);
    });

    DateBukVoipPush.start();
  }
}
