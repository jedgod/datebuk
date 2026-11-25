/**
 * Example: Using the Video Queue API with Pagination
 * 
 * This file demonstrates how to integrate the new paginated video queue API
 * into your components using TanStack Query.
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { VideoQueueResponse, VideoQueueFilters } from '@/types/video-moderation';

export function VideoQueueExample() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<VideoQueueFilters>({
    severity: 'high,critical',
    isLive: false,
    limit: 25,
  });

  // Fetch video queue with pagination
  const { data, isLoading, error, refetch } = useQuery<VideoQueueResponse>({
    queryKey: ['video-queue', page, filters],
    queryFn: async (): Promise<VideoQueueResponse> => {
      const token = localStorage.getItem('auth_token') || undefined;
      return adminApi.getVideoQueue(
        { ...filters, page },
        token
      ) as Promise<VideoQueueResponse>;
    },
    refetchInterval: 10000, // Refresh every 10 seconds for live monitoring
  });

  const videos = data?.data ?? [];
  const pagination = data?.pagination;

  // Handle page navigation
  const handleNextPage = () => {
    if (pagination?.has_more) {
      setPage(p => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(p => p - 1);
    }
  };

  const handleFilterChange = (newFilters: Partial<VideoQueueFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  };

  if (isLoading) {
    return <div className="p-4">Loading video queue...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {String(error)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 p-4 bg-slate-100 rounded-lg">
        <select
          value={filters.severity ?? ''}
          onChange={(e) => handleFilterChange({ severity: e.target.value })}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
          <option value="high,critical">High + Critical</option>
        </select>

        <select
          value={filters.status ?? ''}
          onChange={(e) => handleFilterChange({ status: e.target.value })}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="flagged">Flagged</option>
          <option value="escalated">Escalated</option>
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.isLive ?? false}
            onChange={(e) => handleFilterChange({ isLive: e.target.checked })}
          />
          Live Only
        </label>

        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Video List */}
      <div className="space-y-3">
        {videos.map((video) => (
          <div
            key={video.video_id}
            className="p-4 border rounded-lg bg-white shadow-sm"
          >
            <div className="flex gap-4">
              {/* Thumbnail */}
              {video.thumbnail_url && (
                <img
                  src={video.thumbnail_url}
                  alt="Video thumbnail"
                  className="w-32 h-24 object-cover rounded"
                />
              )}

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">Video: {video.video_id}</h3>
                    <p className="text-sm text-slate-600">
                      User: {video._legacy?.userName ?? video.user_id}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      video.priority === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : video.priority === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : video.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {video.priority}
                  </span>
                </div>

                {/* AI Scores */}
                <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">Nudity:</span>{' '}
                    <span className="font-medium">
                      {(video.ai_scores.nudity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Audio:</span>{' '}
                    <span className="font-medium">
                      {(video.ai_scores.explicit_audio * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Violence:</span>{' '}
                    <span className="font-medium">
                      {(video.ai_scores.violence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Deepfake:</span>{' '}
                    <span className="font-medium">
                      {(video.ai_scores.deepfake * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Flags */}
                <div className="mt-2">
                  <span className="text-sm text-slate-500">Flags:</span>{' '}
                  {video.flags.map((flag, i) => (
                    <span
                      key={i}
                      className="inline-block ml-2 px-2 py-1 bg-slate-100 rounded text-xs"
                    >
                      {flag}
                    </span>
                  ))}
                </div>

                {/* Context */}
                {video.context.last_message_snippet && (
                  <div className="mt-2 text-sm text-slate-600 italic">
                    "{video.context.last_message_snippet}"
                  </div>
                )}

                {/* Status */}
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-medium">{video.status}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-500">Reports: {video.report_count}</span>
                  {video._legacy?.isLive && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="text-red-600 font-medium">🔴 LIVE</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 bg-slate-100 rounded-lg">
        <div className="text-sm text-slate-600">
          Showing {videos.length} of {pagination?.total ?? 0} videos
          {pagination?.page && pagination?.per_page && (
            <> (Page {pagination.page} - Items {(pagination.page - 1) * pagination.per_page + 1} to{' '}
            {Math.min(pagination.page * pagination.per_page, pagination.total)})</>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
          >
            Previous
          </button>
          <span className="px-4 py-2 font-medium">
            Page {pagination?.page ?? 1}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!pagination?.has_more}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// Example: Alternative alias endpoint usage
export function FlaggedVideosExample() {
  const { data } = useQuery<VideoQueueResponse>({
    queryKey: ['flagged-videos'],
    queryFn: async (): Promise<VideoQueueResponse> => {
      const token = localStorage.getItem('auth_token') || undefined;
      // Using the alias endpoint
      return adminApi.getFlaggedVideos(
        {
          severity: 'high,critical',
          page: 1,
          limit: 50,
        },
        token
      ) as Promise<VideoQueueResponse>;
    },
  });

  return <div>Found {data?.data.length ?? 0} flagged videos</div>;
}

// Example: Review action
export async function reviewVideo(
  videoId: string,
  decision: 'approved' | 'flagged' | 'escalated'
) {
  const token = localStorage.getItem('auth_token') || undefined;
  
  try {
    await adminApi.reviewVideoItem(videoId, decision, token);
    console.log(`Video ${videoId} marked as ${decision}`);
    return true;
  } catch (error) {
    console.error('Failed to review video:', error);
    return false;
  }
}
