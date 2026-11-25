'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Activity, Wifi, WifiOff, AlertCircle, TrendingUp } from 'lucide-react';

const SafeAlertCircle = AlertCircle as any;
const SafeWifiOff = WifiOff as any;

interface ConnectionMetric {
  roomId: string;
  userName: string;
  duration: number; // in seconds
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  bitrate: number; // kbps
  packetLoss: number; // percentage
  latency: number; // ms
  startTime: Date;
}

interface WebRTCHealthMonitorProps {
  activeCalls: ConnectionMetric[];
  onInvestigate: (roomId: string) => void;
}

const QUALITY_COLORS = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800',
};

const QUALITY_THRESHOLDS = {
  excellent: { minBitrate: 2500, maxLatency: 30, maxPacketLoss: 1 },
  good: { minBitrate: 1000, maxLatency: 100, maxPacketLoss: 3 },
  fair: { minBitrate: 500, maxLatency: 200, maxPacketLoss: 5 },
  poor: { minBitrate: 0, maxLatency: Infinity, maxPacketLoss: Infinity },
};

export function WebRTCHealthMonitor({
  activeCalls,
  onInvestigate,
}: WebRTCHealthMonitorProps) {
  const [selectedIntent, setSelectedIntent] = useState<'all' | 'active' | 'degraded'>('all');
  const [sortBy, setSortBy] = useState<'duration' | 'quality' | 'bitrate'>('duration');

  const filteredAndSorted = activeCalls
    .filter((call) => {
      if (selectedIntent === 'active') return true;
      if (selectedIntent === 'degraded') return call.quality === 'poor' || call.quality === 'fair';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'duration') return b.duration - a.duration;
      if (sortBy === 'bitrate') return b.bitrate - a.bitrate;
      const qualityRank = { excellent: 4, good: 3, fair: 2, poor: 1 };
      return qualityRank[b.quality] - qualityRank[a.quality];
    });

  const degradedCount = activeCalls.filter(
    (c) => c.quality === 'poor' || c.quality === 'fair',
  ).length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{activeCalls.length}</div>
            <p className="text-xs text-gray-600 mt-1">Active Calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {activeCalls.filter((c) => c.quality === 'excellent' || c.quality === 'good').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Excellent/Good</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{degradedCount}</div>
            <p className="text-xs text-gray-600 mt-1">Degraded Quality</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {(
                activeCalls.reduce((sum, c) => sum + c.bitrate, 0) / 1000
              ).toFixed(1)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Mbps Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Degraded Alert */}
      {degradedCount > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex gap-3">
            <SafeAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900">
                {degradedCount} call(s) with degraded connection quality
              </p>
              <p className="text-yellow-800 text-xs mt-1">
                Monitor for disconnections and proactively support users
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-4">
        <Select value={selectedIntent} onValueChange={(value: any) => setSelectedIntent(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Calls</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="degraded">Degraded Quality</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="duration">Sort: Duration</SelectItem>
            <SelectItem value="quality">Sort: Quality</SelectItem>
            <SelectItem value="bitrate">Sort: Bitrate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calls List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Connections</CardTitle>
          <CardDescription>Real-time WebRTC infrastructure health</CardDescription>
        </CardHeader>
        <CardContent>
          {activeCalls.length === 0 ? (
            <div className="text-center py-8">
              <SafeWifiOff className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No active calls</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {filteredAndSorted.map((call) => (
                  <div
                    key={call.roomId}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-sm">{call.userName}</h4>
                        <p className="text-xs text-gray-600">
                          Room: <span className="font-mono">{call.roomId.slice(0, 8)}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={QUALITY_COLORS[call.quality]}>
                          {call.quality}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onInvestigate(call.roomId)}
                        >
                          Investigate
                        </Button>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600">Duration</p>
                        <p className="font-semibold">
                          {Math.floor(call.duration / 60)}:{String(call.duration % 60).padStart(2, '0')}
                        </p>
                      </div>
                      <div className={`p-2 rounded ${call.bitrate > 1500 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        <p className="text-gray-600">Bitrate</p>
                        <p className="font-semibold">{call.bitrate} kbps</p>
                      </div>
                      <div
                        className={`p-2 rounded ${call.latency < 100 ? 'bg-green-50' : 'bg-yellow-50'}`}
                      >
                        <p className="text-gray-600">Latency</p>
                        <p className="font-semibold">{call.latency}ms</p>
                      </div>
                      <div
                        className={`p-2 rounded ${call.packetLoss < 3 ? 'bg-green-50' : 'bg-red-50'}`}
                      >
                        <p className="text-gray-600">Loss</p>
                        <p className="font-semibold">{call.packetLoss}%</p>
                      </div>
                    </div>

                    {/* Health Indicator */}
                    {(call.quality === 'poor' || call.quality === 'fair') && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        ⚠️ Poor connection quality - User may disconnect soon
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
