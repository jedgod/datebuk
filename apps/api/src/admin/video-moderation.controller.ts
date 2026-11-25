import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { AdminService } from "./admin.service";

@Controller("admin/video-moderation")
export class VideoModerationController {
  constructor(private admin: AdminService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS")
  @Get("queue")
  async queue(
    @Query("status") status?: string,
    @Query("severity") severity?: string,
    @Query("minRiskScore") minRiskScore?: string,
    @Query("isLive") isLive?: string,
    @Query("limit") limit?: string,
    @Query("page") page?: string,
  ) {
    const pageNum = page ? Math.max(Number(page), 1) : 1;
    const perPage = limit ? Math.min(Number(limit), 100) : 25;

    const { items, total } = await this.admin.listVideoModerationQueue({
      status,
      severity,
      minRiskScore: minRiskScore ? Number(minRiskScore) : undefined,
      isLive: typeof isLive === "string" ? isLive === "true" : undefined,
      limit: perPage,
      page: pageNum,
    });

    const mapped = items.map((item) => ({
      // Recommended API field naming
      video_id: item.videoId,
      user_id: item.userId,
      match_id: (item.matchDetails as any)?.matchId ?? null,
      duration_sec: 0, // TODO: Add to schema in future
      created_at: item.createdAt,
      status: item.status,
      ai_scores: {
        nudity: (item.aiScores as any)?.nudityProbability ?? 0,
        explicit_audio: (item.aiScores as any)?.explicitAudioScore ?? 0,
        violence: (item.aiScores as any)?.violenceScore ?? 0,
        deepfake: (item.aiScores as any)?.deepfakeScore ?? 0,
      },
      flags: item.flagReason ? [item.flagReason] : [],
      report_count: item.reportCount,
      priority: item.severity,
      thumbnail_url: item.keyframes?.[0] ?? "",
      keyframe_urls: item.keyframes ?? [],
      waveform_url: null, // Can be generated from audioWaveform if needed
      context: {
        intent: item.userIntent,
        last_message_snippet: this.extractLastMessage(item.recentMessages),
      },
      // Additional metadata for backwards compatibility
      _legacy: {
        id: item.id,
        userName: item.user?.profile?.displayName ?? "Unknown",
        userEmail: item.user?.email ?? "",
        userTrustLevel: item.userTrustLevel,
        uploadedAt: item.createdAt,
        flaggedAt: item.flaggedAt,
        audioWaveform: item.audioWaveform ?? [],
        violationTimestamps: item.violationTimestamps ?? [],
        isLive: item.isLive,
        matchDetails: item.matchDetails ?? null,
      },
    }));

    return {
      data: mapped,
      pagination: {
        total,
        page: pageNum,
        per_page: perPage,
        has_more: total > pageNum * perPage,
      },
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS")
  @Get("metrics")
  async metrics() {
    return this.admin.videoModerationMetrics();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS")
  @Post("queue/:id/review")
  async review(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { decision: "approved" | "flagged" | "escalated" },
  ) {
    return this.admin.reviewVideoModerationItem({
      id,
      decision: body.decision,
      reviewerId: req.user?.userId ?? null,
    });
  }

  // Alias endpoint for recommended naming
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_USERS")
  @Get("flagged-videos")
  async flaggedVideos(
    @Query("status") status?: string,
    @Query("severity") severity?: string,
    @Query("minRiskScore") minRiskScore?: string,
    @Query("isLive") isLive?: string,
    @Query("limit") limit?: string,
    @Query("page") page?: string,
  ) {
    return this.queue(status, severity, minRiskScore, isLive, limit, page);
  }

  private extractLastMessage(messages: any): string {
    if (!messages) return "";
    if (Array.isArray(messages) && messages.length > 0) {
      const last = messages[messages.length - 1];
      return last?.content ?? last?.text ?? last?.message ?? "";
    }
    if (typeof messages === "object" && messages.lastMessage) {
      return messages.lastMessage ?? "";
    }
    return "";
  }
}
