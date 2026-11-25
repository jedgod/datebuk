import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { getSocket } from "./socket";
import { showIncomingCall } from "./incoming-call";

export function useCallEvents(accessToken: string, onOpenCall: (callId: string) => void) {
  useEffect(() => {
    const socket = getSocket(accessToken);

    const handleIncoming = (payload: any) => {
      showIncomingCall({
        callId: payload.callId,
        callerName: payload.callerName,
        callerHandle: payload.callerId,
        video: payload.type === "VIDEO"
      });
    };

    socket.on("call:incoming", handleIncoming);

    const notificationSub =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as any;
        if (data?.event === "incoming-call" && data.callId) {
          onOpenCall(String(data.callId));
        }
      });

    const interval = setInterval(() => socket.emit("presence:heartbeat"), 30_000);

    return () => {
      clearInterval(interval);
      notificationSub.remove();
      socket.off("call:incoming", handleIncoming);
    };
  }, [accessToken, onOpenCall]);
}
