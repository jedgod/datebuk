import { Platform } from "react-native";

export async function registerCallToken(
  pushToken: string,
  accessToken: string
) {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/devices/call-token`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
        tokenType: Platform.OS === "ios" ? "APNS_VOIP" : "FCM",
        pushToken
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Token registration failed: ${response.status}`);
  }

  return response.json();
}
