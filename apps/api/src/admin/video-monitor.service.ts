import { Injectable } from "@nestjs/common";
import { logger } from "../common/logging/logger";

type SignalingParticipant = { displayName: string; bitrateKbps: number; packetLossPercent: number; rttMs: number };
type SignalingRoom = { roomId: string; startedAt: number; participants: SignalingParticipant[] };

export type ActiveCallMetric = {
  roomId: string;
  userName: string;
  duration: number;
  quality: "excellent" | "good" | "fair" | "poor";
  bitrate: number;
  packetLoss: number;
  latency: number;
  startTime: string;
};

// Mirrors the thresholds already defined (but never applied) in
// apps/web/src/components/staff/video-monitor/WebRTCHealthMonitor.tsx — this is the one
// place that now actually computes the quality label those thresholds were written for.
const QUALITY_THRESHOLDS: Array<{ label: ActiveCallMetric["quality"]; minBitrate: number; maxLatency: number; maxPacketLoss: number }> = [
  { label: "excellent", minBitrate: 2500, maxLatency: 30, maxPacketLoss: 1 },
  { label: "good", minBitrate: 1000, maxLatency: 100, maxPacketLoss: 3 },
  { label: "fair", minBitrate: 500, maxLatency: 200, maxPacketLoss: 5 },
];
const QUALITY_RANK: Record<ActiveCallMetric["quality"], number> = { excellent: 4, good: 3, fair: 2, poor: 1 };

function classify(bitrate: number, latency: number, packetLoss: number): ActiveCallMetric["quality"] {
  for (const t of QUALITY_THRESHOLDS) {
    if (bitrate >= t.minBitrate && latency <= t.maxLatency && packetLoss <= t.maxPacketLoss) return t.label;
  }
  return "poor";
}

@Injectable()
export class VideoMonitorService {
  private readonly signalingUrl = (process.env.SIGNALING_URL || "http://localhost:4001").replace(/\/$/, "");
  private readonly internalKey = process.env.SIGNALING_INTERNAL_KEY || "";

  async getActiveCalls(): Promise<ActiveCallMetric[]> {
    if (!this.internalKey) {
      logger.warn({ msg: "video_monitor_misconfigured", reason: "SIGNALING_INTERNAL_KEY not set" });
      return [];
    }

    let response: Response;
    try {
      response = await fetch(`${this.signalingUrl}/internal/active-rooms`, {
        headers: { "x-internal-key": this.internalKey },
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      logger.warn({ msg: "video_monitor_signaling_unreachable", error: err instanceof Error ? err.message : String(err) });
      return [];
    }
    if (!response.ok) {
      logger.warn({ msg: "video_monitor_signaling_error", status: response.status });
      return [];
    }

    const body = (await response.json()) as { rooms: SignalingRoom[] };
    const now = Date.now();

    return body.rooms.map((room) => {
      // A room is a 1:1 call; when both sides have reported, surface the worse-case
      // numbers so a staff member scanning the list doesn't miss a degraded connection
      // just because the other side of the call still looks fine.
      const bitrate = Math.min(...room.participants.map((p) => p.bitrateKbps));
      const packetLoss = Math.max(...room.participants.map((p) => p.packetLossPercent));
      const latency = Math.max(...room.participants.map((p) => p.rttMs));
      const quality = room.participants
        .map((p) => classify(p.bitrateKbps, p.rttMs, p.packetLossPercent))
        .reduce((worst, q) => (QUALITY_RANK[q] < QUALITY_RANK[worst] ? q : worst), "excellent" as ActiveCallMetric["quality"]);

      return {
        roomId: room.roomId,
        userName: room.participants.map((p) => p.displayName).join(" & "),
        duration: Math.max(0, Math.round((now - room.startedAt) / 1000)),
        quality,
        bitrate: Math.round(bitrate),
        packetLoss: Math.round(packetLoss * 10) / 10,
        latency: Math.round(latency),
        startTime: new Date(room.startedAt).toISOString(),
      };
    });
  }
}
