import { Injectable, NestMiddleware } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private metrics: MetricsService) {}

  use(req: any, res: any, next: () => void) {
    const start = Date.now();
    // route label: best-effort (fallback to path)
    const route = (req.route?.path ? String(req.route.path) : (req.baseUrl ? String(req.baseUrl) : String(req.path || req.url)));
    res.on("finish", () => {
      this.metrics.observeHttp(req.method, route, res.statusCode, Date.now() - start);
    });
    next();
  }
}
