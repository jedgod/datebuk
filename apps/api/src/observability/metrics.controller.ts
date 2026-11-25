import { Controller, Get, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { MetricsService } from "./metrics.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";

@Controller()
export class MetricsController {
  constructor(private metrics: MetricsService) {}

  // Protect metrics in app environments; in k8s you can scrape via sidecar or dedicated auth.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ADMIN_VIEW_AUDIT")
  @Get("metrics")
  async metricsEndpoint(@Res() res: Response) {
    const body = await this.metrics.metricsText();
    res.setHeader("Content-Type", this.metrics.contentType());
    res.status(200).send(body);
  }
}
