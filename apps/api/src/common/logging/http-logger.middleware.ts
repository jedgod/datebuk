import { Injectable, NestMiddleware } from "@nestjs/common";
import { logger } from "./logger";

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const start = Date.now();
    const rid = req.requestId;

    res.on("finish", () => {
      const ms = Date.now() - start;
      logger.info({
        msg: "http_request",
        requestId: rid,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: ms,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
    });

    next();
  }
}
