import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { SettingsService, SettingsPayload } from "./settings.service";

@Controller("settings")
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  get(@Req() req: any) {
    return this.settings.getForUser(req.user.userId);
  }

  @Patch()
  update(@Req() req: any, @Body() body: Partial<SettingsPayload>) {
    return this.settings.updateForUser(req.user.userId, body || {});
  }
}
