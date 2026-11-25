import { Platform } from "react-native";

export async function registerNativeCallToken(
  token: string,
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
        token
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Call-token registration failed: ${response.status}`);
  }
}
