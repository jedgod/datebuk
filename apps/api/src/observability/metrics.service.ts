import { Injectable } from "@nestjs/common";
import client from "prom-client";

@Injectable()
export class MetricsService {
  private registry = new client.Registry();
  private httpRequests = new client.Counter({
    name: "http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status"],
    registers: [this.registry],
  });
  private httpDuration = new client.Histogram({
    name: "http_request_duration_ms",
    help: "HTTP request duration in ms",
    labelNames: ["method", "route", "status"],
    buckets: [5, 10, 25, 50, 100, 200, 400, 800, 1500, 3000, 8000],
    registers: [this.registry],
  });

  constructor() {
    client.collectDefaultMetrics({ register: this.registry });
  }

  observeHttp(method: string, route: string, status: number, durationMs: number) {
    const s = String(status);
    this.httpRequests.inc({ method, route, status: s });
    this.httpDuration.observe({ method, route, status: s }, durationMs);
  }

  async metricsText() {
    return this.registry.metrics();
  }

  contentType() {
    return this.registry.contentType;
  }
}
