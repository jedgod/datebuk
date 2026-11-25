import { Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@Req() req: any) {
    return this.notifications.listForUser(req.user.userId);
  }

  @Post(":id/read")
  markRead(@Req() req: any, @Param("id") id: string) {
    return this.notifications.markRead(req.user.userId, id);
  }

  @Post("read-all")
  markAllRead(@Req() req: any) {
    return this.notifications.markAllRead(req.user.userId);
  }

  @Delete(":id")
  remove(@Req() req: any, @Param("id") id: string) {
    return this.notifications.remove(req.user.userId, id);
  }
}
