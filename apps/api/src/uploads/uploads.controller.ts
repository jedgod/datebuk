import { Body, Controller, Get, Post, Query, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { UploadsService } from "./uploads.service";
import { PgBossService } from "../common/pgboss/pgboss.service";

@Controller("uploads")
export class UploadsController {
  constructor(
    private uploads: UploadsService,
    private pgBoss: PgBossService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("presign")
  presign(
    @Req() req: any,
    @Body() body: {
      contentType: string;
      kind?: "image" | "video" | "audio";
      fileName?: string;
      sizeBytes?: number;
    },
  ) {
    return this.uploads.createPresignedUpload(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post("complete")
  async complete(@Req() req: any, @Body() body: { key: string }) {
    const completed = await this.uploads.completeUpload(req.user.userId, body.key);
    if (completed.kind === "image") {
      await this.pgBoss.add("uploads", { key: body.key }, { attempts: 3 });
    }
    return completed;
  }

  @UseGuards(JwtAuthGuard)
  @Get("access")
  access(@Req() req: any, @Query("key") key: string) {
    return this.uploads.createPrivateDownload(req.user.userId, key);
  }
}
