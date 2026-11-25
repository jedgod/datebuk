import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import { PrismaService } from "../database/prisma.service";

@Controller()
export class HealthController {
  constructor(private health: HealthCheckService, private prisma: PrismaService) {}

  @Get()
  root() {
    return {
      name: "DateBuk API",
      version: "1.0.0",
      status: "operational",
      endpoints: {
        health: "/health",
        ready: "/ready",
        metrics: "/metrics"
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get("health")
  @HealthCheck()
  check() {
    // Liveness: app is up
    return this.health.check([async () => ({ app: { status: "up" } })]);
  }

  @Get("ready")
  @HealthCheck()
  ready() {
    // Readiness: dependencies reachable
    return this.health.check([
      async () => {
        await this.prisma.$queryRaw`SELECT 1`;
        return { db: { status: "up" } };
      },
    ]);
  }
}
