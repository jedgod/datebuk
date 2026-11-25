import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

export async function registerForCallNotifications(accessToken: string) {
  if (!Device.isDevice) {
    throw new Error("Push notifications require a physical device");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("calls", {
      name: "Incoming calls",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;

  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }

  if (status !== "granted") {
    throw new Error("Notification permission denied");
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/devices/register`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
      pushToken: token,
      deviceName: Device.deviceName ?? undefined
    })
  });

  return token;
}
