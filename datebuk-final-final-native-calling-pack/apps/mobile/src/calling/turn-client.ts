export async function fetchIceServers(accessToken: string) {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/turn-credentials`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`TURN credential request failed: ${response.status}`);
  }

  return response.json() as Promise<{
    ttl: number;
    expiresAt: number;
    iceServers: RTCIceServer[];
  }>;
}
