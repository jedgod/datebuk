import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { memoryStorage } from "multer";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { IdentityService } from "./identity.service";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

type Uploaded = Record<"idFront" | "selfie" | "selfieChallenge", Express.Multer.File[] | undefined>;

@Controller("identity")
export class IdentityController {
  constructor(private identity: IdentityService) {}

  // --- Authenticated (the signed-in user starting / checking their own verification) ---

  /** Web registration: text the user a link to scan their ID and take selfies on their phone. */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @Post("start")
  start(@Req() req: any, @Body() body: { phone?: string; consent?: boolean }) {
    return this.identity.startBySms(req.user.userId, body?.phone ?? "", body?.consent === true, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  /** Mobile app registration: begin the same flow in-app (no SMS needed). */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Post("start-in-app")
  startInApp(@Req() req: any, @Body() body: { consent?: boolean }) {
    return this.identity.startInApp(req.user.userId, body?.consent === true, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("status")
  status(@Req() req: any) {
    return this.identity.status(req.user.userId);
  }

  // --- Capture (authorized by the one-time token from the texted link / in-app session) ---

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get("capture/:token")
  info(@Param("token") token: string) {
    return this.identity.captureInfo(token);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("capture/:token/submit")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "idFront", maxCount: 1 },
        { name: "selfie", maxCount: 1 },
        { name: "selfieChallenge", maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: MAX_IMAGE_BYTES, files: 3, fields: 0 },
        fileFilter: (_req, file, cb) => {
          if (!IMAGE_TYPES.has(file.mimetype)) return cb(new BadRequestException("Only JPEG, PNG or WebP images are accepted"), false);
          cb(null, true);
        },
      },
    ),
  )
  submit(@Param("token") token: string, @UploadedFiles() files: Uploaded, @Req() req: any) {
    const idFront = files?.idFront?.[0]?.buffer;
    const selfie = files?.selfie?.[0]?.buffer;
    const selfieChallenge = files?.selfieChallenge?.[0]?.buffer;
    if (!idFront || !selfie || !selfieChallenge) {
      throw new BadRequestException("idFront, selfie and selfieChallenge images are all required");
    }
    return this.identity.submit(
      token,
      { idFront, selfie, selfieChallenge },
      { ip: req.ip, userAgent: req.headers["user-agent"] },
    );
  }
}
