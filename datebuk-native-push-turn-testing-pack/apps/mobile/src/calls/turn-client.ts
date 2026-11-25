export type TurnResponse = {
  ttl: number;
  expiresAt: number;
  iceServers: RTCIceServer[];
};

export async function getTemporaryIceServers(accessToken: string) {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/turn-credentials`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!response.ok) {
    throw new Error(`TURN credentials failed: ${response.status}`);
  }

  return (await response.json()) as TurnResponse;
}
