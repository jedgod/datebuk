import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { RTCView } from "react-native-webrtc";
import { useDateBukCall } from "../hooks/useDateBukCall";
import { endNativeCall } from "../services/callkeep";

type Props = {
  route: {
    params: {
      selfId: string;
      peerId: string;
      callId: string;
      media: "voice" | "video";
      incoming?: boolean;
    };
  };
  navigation: any;
};

export default function CallScreen({ route, navigation }: Props) {
  const { selfId, peerId, callId, media, incoming } = route.params;
  const call = useDateBukCall(selfId);
  const { startCall, prepareIncoming } = call;
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (incoming) {
      prepareIncoming(peerId, callId, media);
    } else {
      void startCall(peerId, callId, media);
    }
  }, [incoming, startCall, prepareIncoming, peerId, callId, media]);

  const accept = async () => {
    await call.acceptCall(peerId, callId, media);
  };

  const hang = () => {
    call.endCall();
    endNativeCall(callId);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      {media === "video" && call.remoteStream ? (
        <RTCView
          style={styles.remote}
          streamURL={call.remoteStream.toURL()}
          objectFit="cover"
        />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.initial}>{peerId.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}

      {media === "video" && call.localStream ? (
        <RTCView
          style={styles.local}
          streamURL={call.localStream.toURL()}
          mirror
          objectFit="cover"
        />
      ) : null}

      <View style={styles.meta}>
        <Text style={styles.name}>{peerId}</Text>
        <Text style={styles.status}>
          {incoming && call.status === "ringing" ? "Incoming call" : call.status}
        </Text>
        {call.error ? <Text style={styles.error}>{call.error}</Text> : null}
      </View>

      {incoming && call.status === "ringing" ? (
        <View style={styles.controls}>
          <CallButton label="Decline" onPress={hang} />
          <CallButton label="Accept" onPress={() => void accept()} />
        </View>
      ) : (
        <View style={styles.controls}>
          <CallButton
            label={call.muted ? "Unmute" : "Mute"}
            onPress={() => call.toggleMute()}
          />
          {media === "video" ? (
            <CallButton
              label={call.cameraEnabled ? "Camera off" : "Camera on"}
              onPress={() => call.toggleCamera()}
            />
          ) : null}
          <CallButton label="End" onPress={hang} />
        </View>
      )}
    </SafeAreaView>
  );
}

function CallButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#090B12",
    alignItems: "center",
    justifyContent: "center",
  },
  remote: {
    ...StyleSheet.absoluteFillObject,
  },
  local: {
    position: "absolute",
    right: 18,
    top: 60,
    width: 110,
    height: 160,
    borderRadius: 18,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontSize: 54,
    color: "white",
    fontWeight: "800",
  },
  meta: {
    position: "absolute",
    top: 90,
    alignItems: "center",
  },
  name: {
    color: "white",
    fontSize: 27,
    fontWeight: "800",
  },
  status: {
    color: "#CBD5E1",
    marginTop: 8,
    textTransform: "capitalize",
  },
  error: {
    color: "#FDA4AF",
    marginTop: 8,
    maxWidth: 280,
    textAlign: "center",
  },
  controls: {
    position: "absolute",
    bottom: 55,
    flexDirection: "row",
    gap: 16,
  },
  button: {
    minWidth: 88,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,.16)",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
  },
});
