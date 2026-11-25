"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Video, X, Plus, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRevenueCatEntitlements } from "@/hooks/useRevenueCatEntitlements";

interface Schedule {
  id: string;
  roomId: string;
  matchName: string;
  matchPhoto: string;
  scheduledTime: string;
  duration: number;
  status: string;
}

export default function VideoSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentTier } = useRevenueCatEntitlements();
  const tier = getCurrentTier();
  const canUseVideo = tier === "elite";

  useEffect(() => {
    if (!canUseVideo) {
      setLoading(false);
      setSchedules([]);
      setError(null);
      return;
    }
    loadSchedules();
  }, [canUseVideo]);

  const loadSchedules = async () => {
    try {
      setError(null);
      const response = await fetch("/api/video-session/schedule");
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Failed to load schedules");
        return;
      }
      if (data.success) {
        setSchedules(data.sessions);
      }
    } catch (error) {
      console.error("Failed to load schedules:", error);
      setError("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const cancelSchedule = async (sessionId: string) => {
    if (!confirm("Cancel this video date?")) return;

    try {
      const response = await fetch(`/api/video-session/schedule?sessionId=${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSchedules((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data?.error || "Failed to cancel schedule");
      }
    } catch (error) {
      console.error("Failed to cancel:", error);
      setError("Failed to cancel schedule");
    }
  };

  const getTimeUntil = (scheduledTime: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diff = scheduled.getTime() - now.getTime();

    if (diff < 0) return "Now";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `in ${days} day${days > 1 ? "s" : ""}`;
    }
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduled Video Dates</h1>
          <p className="text-gray-600 mt-1">Manage your upcoming video calls</p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            {canUseVideo ? <Crown size={13} /> : <Lock size={13} />} Plan: {tier.toUpperCase()} {canUseVideo ? "• Video unlocked" : "• Elite required for video"}
          </div>
        </div>
        <Button className="flex items-center gap-2" disabled={!canUseVideo}>
          <Plus className="w-4 h-4" />
          Schedule New
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      {/* Schedules List */}
      {!canUseVideo ? (
        <div className="text-center py-12 bg-amber-50 rounded-2xl border border-amber-200">
          <Lock className="w-16 h-16 mx-auto text-amber-500" />
          <h3 className="mt-4 text-xl font-semibold text-amber-900">Video schedule is locked</h3>
          <p className="mt-2 text-amber-700">Upgrade to Elite to manage and join video schedules.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedules...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Video className="w-16 h-16 mx-auto text-gray-400" />
          <h3 className="mt-4 text-xl font-semibold">No scheduled video dates</h3>
          <p className="mt-2 text-gray-600">Schedule a video date with your matches!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                {/* Match Info */}
                <div className="flex items-center gap-4">
                  <img
                    src={schedule.matchPhoto}
                    alt={schedule.matchName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{schedule.matchName}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(schedule.scheduledTime).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(schedule.scheduledTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        {schedule.duration / 60} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4">
                    <div className="text-sm font-semibold text-purple-600">
                      {getTimeUntil(schedule.scheduledTime)}
                    </div>
                    {new Date(schedule.scheduledTime).getTime() - Date.now() < 60 * 60 * 1000 && (
                      <div className="text-xs text-green-600 mt-1">✓ Reminder sent</div>
                    )}
                  </div>

                  <Button
                    onClick={() => (window.location.href = `/video-call/${schedule.roomId}`)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    Join Call
                  </Button>

                  <button
                    type="button"
                    title="Cancel video schedule"
                    aria-label="Cancel video schedule"
                    onClick={() => cancelSchedule(schedule.id)}
                    className="w-10 h-10 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📅 Scheduling Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Pick a time that works for both of you</li>
            <li>• You'll get reminders 1 hour and 15 minutes before</li>
            <li>• Test your camera/mic before the call</li>
          </ul>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="font-semibold text-green-900 mb-2">✅ Virtual Background</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Available during video calls</li>
            <li>• Protect your privacy</li>
            <li>• Choose from preset backgrounds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
