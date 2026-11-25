import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { VideoMonitorService } from "./video-monitor.service";

@Controller("admin/video-monitor")
export class VideoMonitorController {
  constructor(private videoMonitor: VideoMonitorService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_SESSIONS")
  @Get("active-calls")
  async activeCalls() {
    return this.videoMonitor.getActiveCalls();
  }
}
