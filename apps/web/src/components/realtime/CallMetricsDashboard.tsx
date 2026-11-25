'use client';

/**
 * CallMetricsDashboard Component
 * Real-time display of call quality metrics (jitter, latency, packet loss, bandwidth)
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Phone, Activity } from 'lucide-react';

const SafeTrendingUp = TrendingUp as any;
const SafeAlertCircle = AlertCircle as any;
const SafeCheckCircle = CheckCircle as any;
const SafePhone = Phone as any;
const SafeActivity = Activity as any;
import { useCallMetricsMap, useRealtimeStore } from '@/stores/realtime';
import { useRealtime } from '@/hooks/useRealtime';
import type { CallMetrics } from '@/types/realtime';

interface MetricBarProps {
  label: string;
  value: number;
  unit: string;
  max: number;
  threshold?: number;
  isGood: boolean;
}

function MetricBar({ label, value, unit, max, threshold, isGood }: MetricBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-semibold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
          {value.toFixed(2)} {unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isGood ? 'bg-green-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {threshold && (
        <p className="text-xs text-gray-500">
          Threshold: {threshold} {unit}
        </p>
      )}
    </div>
  );
}

interface CallMetricsCardProps {
  callId: string;
  metrics: CallMetrics;
  onClose?: (callId: string) => void;
}

function CallMetricsCard({ callId, metrics, onClose }: CallMetricsCardProps) {
  const isCallGood = metrics.quality === 'excellent' || metrics.quality === 'good';

  // Thresholds for quality metrics
  const thresholds = {
    jitter: 30, // ms
    latency: 150, // ms
    packetLoss: 1, // %
    bandwidth: 100, // kbps
  };

  const isGood = {
    jitter: metrics.jitter <= thresholds.jitter,
    latency: metrics.latency <= thresholds.latency,
    packetLoss: metrics.packetLoss <= thresholds.packetLoss,
    bandwidth: metrics.bandwidth >= thresholds.bandwidth,
  };

  const qualityColors = {
    excellent: 'bg-green-50 border-green-200',
    good: 'bg-blue-50 border-blue-200',
    fair: 'bg-yellow-50 border-yellow-200',
    poor: 'bg-red-50 border-red-200',
  };

  const qualityBadgeColors = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    fair: 'bg-yellow-100 text-yellow-800',
    poor: 'bg-red-100 text-red-800',
  };

  const lastUpdateAgo = Math.floor((Date.now() - metrics.lastUpdate) / 1000);

  return (
    <div className={`rounded-lg border p-4 space-y-4 ${qualityColors[metrics.quality as keyof typeof qualityColors]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <SafePhone className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Call {callId.slice(0, 8)}</h3>
            <p className="text-xs text-gray-500">Updated {lastUpdateAgo}s ago</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${qualityBadgeColors[metrics.quality as keyof typeof qualityBadgeColors]}`}>
            {metrics.quality.charAt(0).toUpperCase() + metrics.quality.slice(1)}
          </span>
          {onClose && (
            <button
              onClick={() => onClose(callId)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <MetricBar
          label="Latency"
          value={metrics.latency}
          unit="ms"
          max={300}
          threshold={thresholds.latency}
          isGood={isGood.latency}
        />
        <MetricBar
          label="Jitter"
          value={metrics.jitter}
          unit="ms"
          max={50}
          threshold={thresholds.jitter}
          isGood={isGood.jitter}
        />
        <MetricBar
          label="Packet Loss"
          value={metrics.packetLoss}
          unit="%"
          max={10}
          threshold={thresholds.packetLoss}
          isGood={isGood.packetLoss}
        />
        <MetricBar
          label="Bandwidth"
          value={metrics.bandwidth}
          unit="kbps"
          max={1000}
          threshold={thresholds.bandwidth}
          isGood={isGood.bandwidth}
        />
      </div>

      <div className="pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          {isCallGood ? (
            <>
              <SafeCheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">Call quality is excellent</span>
            </>
          ) : (
            <>
              <SafeAlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">Call quality may be degraded</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface CallMetricsDashboardProps {
  maxDisplay?: number;
  compact?: boolean;
}

export function CallMetricsDashboard({ maxDisplay = 5, compact = false }: CallMetricsDashboardProps) {
  const callMetricsMap = useCallMetricsMap();
  const removeCallMetrics = useRealtimeStore((s) => s.removeCallMetrics);
  const [metrics, setMetrics] = useState<CallMetrics[]>([]);

  // Initialize WebSocket connection
  useRealtime({
    enabled: true,
    autoSubscribeAll: true,
  });

  // Update metrics array when map changes
  useEffect(() => {
    const metricsArray = Array.from(callMetricsMap.values()).slice(0, maxDisplay);
    setMetrics(metricsArray);
  }, [callMetricsMap, maxDisplay]);

  if (compact && metrics.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-2 py-1">
          <SafeActivity className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">Active Calls</h3>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {metrics.length}
          </span>
        </div>
        {metrics.map((m) => (
          <div key={m.callId} className="text-xs space-y-1 px-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">{m.callId.slice(0, 8)}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                m.quality === 'excellent' || m.quality === 'good'
                  ? 'bg-green-100 text-green-700'
                  : m.quality === 'fair'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {m.quality}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SafeActivity className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Call Metrics</h2>
          </div>
          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {metrics.length} active
          </span>
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500">
          <SafePhone className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No active calls</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {metrics.map((m) => (
            <CallMetricsCard
              key={m.callId}
              callId={m.callId}
              metrics={m}
              onClose={removeCallMetrics}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Call Quality Indicator (small badge)
 */
export function CallQualityIndicator({ callId }: { callId: string }) {
  const getCallMetrics = useRealtimeStore((s) => s.getCallMetrics);
  const metrics = getCallMetrics(callId);

  if (!metrics) return null;

  const qualityColors = {
    excellent: 'bg-green-100 text-green-700 border-green-200',
    good: 'bg-blue-100 text-blue-700 border-blue-200',
    fair: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    poor: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${qualityColors[metrics.quality as keyof typeof qualityColors]}`}>
      {metrics.quality}
    </span>
  );
}

/**
 * Metrics Summary Card
 */
export function MetricsSummary() {
  const callMetricsMap = useCallMetricsMap();
  const metrics = Array.from(callMetricsMap.values());

  if (metrics.length === 0) {
    return null;
  }

  const avgLatency = metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length;
  const avgJitter = metrics.reduce((sum, m) => sum + m.jitter, 0) / metrics.length;
  const maxPacketLoss = Math.max(...metrics.map((m) => m.packetLoss));
  const poorQualityCalls = metrics.filter(
    (m) => m.quality === 'fair' || m.quality === 'poor'
  ).length;

  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
        <p className="text-blue-600 text-xs font-semibold">Avg Latency</p>
        <p className="text-lg font-bold text-blue-900">{avgLatency.toFixed(0)}ms</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
        <p className="text-blue-600 text-xs font-semibold">Avg Jitter</p>
        <p className="text-lg font-bold text-blue-900">{avgJitter.toFixed(1)}ms</p>
      </div>
      <div className={`rounded px-3 py-2 border ${
        maxPacketLoss > 2 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
      }`}>
        <p className={`text-xs font-semibold ${maxPacketLoss > 2 ? 'text-red-600' : 'text-green-600'}`}>
          Max Packet Loss
        </p>
        <p className={`text-lg font-bold ${maxPacketLoss > 2 ? 'text-red-900' : 'text-green-900'}`}>
          {maxPacketLoss.toFixed(1)}%
        </p>
      </div>
      <div className={`rounded px-3 py-2 border ${
        poorQualityCalls > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
      }`}>
        <p className={`text-xs font-semibold ${poorQualityCalls > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
          Poor Quality
        </p>
        <p className={`text-lg font-bold ${poorQualityCalls > 0 ? 'text-yellow-900' : 'text-green-900'}`}>
          {poorQualityCalls}
        </p>
      </div>
    </div>
  );
}
