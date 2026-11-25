export async function startCall(
  accessToken: string,
  input: {
    calleeId: string;
    callerName: string;
    type: "VOICE" | "VIDEO";
  }
) {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/calls`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    }
  );

  if (!response.ok) {
    throw new Error(`Call creation failed: ${response.status}`);
  }

  return response.json();
}

export async function updateCallStatus(
  accessToken: string,
  callId: string,
  status: "ACCEPTED" | "REJECTED" | "CANCELLED" | "ENDED" | "FAILED",
  reason?: string
) {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/calls/${callId}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status, reason })
    }
  );

  if (!response.ok) {
    throw new Error(`Call status update failed: ${response.status}`);
  }

  return response.json();
}
