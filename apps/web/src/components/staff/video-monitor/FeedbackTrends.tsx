'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, Heart, Zap } from 'lucide-react';

const SafeResponsiveContainer = ResponsiveContainer as any;
const SafeLineChart = LineChart as any;
const SafeCartesianGrid = CartesianGrid as any;
const SafeXAxis = XAxis as any;
const SafeYAxis = YAxis as any;
const SafeTooltip = Tooltip as any;
const SafeLine = Line as any;
const SafeAlertTriangle = AlertTriangle as any;
const SafeHeart = Heart as any;

interface FeedbackTrend {
  date: string;
  wouldMeetAgain: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  averageVibe: number;
  followupRate: number;
}

interface FeedbackInsight {
  userId: string;
  userName: string;
  lastFeedback: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  communityCompatibility: number;
  redFlags: string[];
}

interface FeedbackTrendsProps {
  trends: FeedbackTrend[];
  insights: FeedbackInsight[];
  onReviewUser: (userId: string) => void;
}

export function FeedbackTrends({
  trends,
  insights,
  onReviewUser,
}: FeedbackTrendsProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [sentiment, setSentiment] = useState('all');

  const filteredInsights = insights.filter((insight) => {
    if (sentiment === 'all') return true;
    return insight.sentiment === sentiment;
  });

  const positiveCount = insights.filter((i) => i.sentiment === 'positive').length;
  const neutralCount = insights.filter((i) => i.sentiment === 'neutral').length;
  const negativeCount = insights.filter((i) => i.sentiment === 'negative').length;
  const redFlagCount = insights.filter((i) => i.redFlags.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{positiveCount}</div>
            <p className="text-xs text-gray-600 mt-1">Positive Sentiment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{neutralCount}</div>
            <p className="text-xs text-gray-600 mt-1">Neutral Sentiment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{negativeCount}</div>
            <p className="text-xs text-gray-600 mt-1">Negative Sentiment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{redFlagCount}</div>
            <p className="text-xs text-gray-600 mt-1">Red Flag Indicators</p>
          </CardContent>
        </Card>
      </div>

      {/* Red Flag Alert */}
      {redFlagCount > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex gap-3">
            <SafeAlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-orange-900">
                {redFlagCount} user(s) with potential safety or behavior concerns
              </p>
              <p className="text-orange-800 text-xs mt-1">
                Review feedback patterns and consider intervention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Sentiment Trends</CardTitle>
          <CardDescription>Post-date feedback sentiment over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <SafeResponsiveContainer width="100%" height="100%">
              <SafeLineChart data={trends}>
                <SafeCartesianGrid strokeDasharray="3 3" />
                <SafeXAxis dataKey="date" />
                <SafeYAxis />
                <SafeTooltip />
                <SafeLine
                  type="monotone"
                  dataKey="wouldMeetAgain"
                  stroke="#10b981"
                  name="Would Meet Again %"
                />
                <SafeLine
                  type="monotone"
                  dataKey="followupRate"
                  stroke="#3b82f6"
                  name="Follow-up Rate %"
                />
                <SafeLine
                  type="monotone"
                  dataKey="averageVibe"
                  stroke="#f59e0b"
                  name="Avg Vibe Score (1-10)"
                />
              </SafeLineChart>
            </SafeResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* User Insights */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Feedback Patterns</CardTitle>
              <CardDescription>Aggregated user behavior and sentiment insights</CardDescription>
            </div>
            <Select value={sentiment} onValueChange={setSentiment}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInsights.length === 0 ? (
            <div className="text-center py-8">
              <SafeHeart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No feedback data</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {filteredInsights.map((insight) => (
                  <div
                    key={insight.userId}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => onReviewUser(insight.userId)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{insight.userName}</h4>
                        <p className="text-xs text-gray-600">
                          Last feedback:{' '}
                          {new Date(insight.lastFeedback).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          insight.sentiment === 'positive'
                            ? 'default'
                            : insight.sentiment === 'neutral'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {insight.sentiment}
                      </Badge>
                    </div>

                    {/* Compatibility */}
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        Community Compatibility
                      </p>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            insight.communityCompatibility > 70
                              ? 'bg-green-500'
                              : insight.communityCompatibility > 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${insight.communityCompatibility}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {insight.communityCompatibility}%
                      </p>
                    </div>

                    {/* Red Flags */}
                    {insight.redFlags.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-red-600">
                          ⚠️ Potential Concerns:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {insight.redFlags.map((flag) => (
                            <Badge key={flag} variant="outline" className="text-red-600">
                              {flag}
                            </Badge>
                          ))}
                        </div>
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
