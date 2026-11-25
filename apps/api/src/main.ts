import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { RequestIdMiddleware } from "./common/logging/request-id.middleware";
import { HttpLoggerMiddleware } from "./common/logging/http-logger.middleware";
import { logger } from "./common/logging/logger";

async function bootstrap() {
  console.log("Bootstrap starting...");

  try {
    const app = await NestFactory.create(AppModule, { logger: console });
    console.log("NestFactory.create completed");

    // Trust exactly one reverse-proxy hop in front of the API (nginx/ALB/etc.) so
    // req.ip and X-Forwarded-* are only honored from that hop, not from arbitrary clients.
    app.getHttpAdapter().getInstance().set("trust proxy", 1);

    // Security headers. This is a pure JSON API (no server-rendered HTML), so CSP is
    // locked down to "default-src 'none'" rather than tuned for script/style origins.
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'none'"],
            frameAncestors: ["'none'"],
          },
        },
        crossOriginResourcePolicy: { policy: "same-site" },
        hsts: { maxAge: 15552000, includeSubDomains: true },
      }),
    );

    // Normalize API surface to a single /api prefix for all controllers.
    app.setGlobalPrefix("api");

    app.use(cookieParser());

    const webUrl = process.env.WEB_URL || "http://localhost:3000";
    app.enableCors({ origin: webUrl, credentials: true });

    // request id + structured logs
    app.use(new RequestIdMiddleware().use);
    app.use(new HttpLoggerMiddleware().use);

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

    const port = process.env.PORT || 4000;
    console.log(`Starting server on port ${port}...`);
    await app.listen(port);
    console.log(`✓ API server started on http://localhost:${port}/api`);

    logger.info({ msg: "api_started", port });
  } catch (error) {
    console.error("Bootstrap error:", error);
    process.exit(1);
  }
}
bootstrap();
