import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ConciergeResponseType } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { ConciergeService } from "./concierge.service";
import { UsersService } from "../users/users.service";

@UseGuards(JwtAuthGuard)
@Controller("concierge")
export class ConciergeController {
  constructor(private concierge: ConciergeService, private users: UsersService) {}
  @Get("overview") overview(@Req() req: any) { return this.concierge.overview(req.user.userId); }
  @Get("catalog") catalog(@Req() req: any) { return this.concierge.catalog(req.user.userId); }
  @Get("eligibility/:recipientId") eligibility(@Req() req: any, @Param("recipientId") recipientId: string) { return this.concierge.eligibility(req.user.userId, recipientId); }
  @Post("requests") create(@Req() req: any, @Body() body: { recipientId: string; reason: string; requesterMessage: string }) { return this.concierge.createRequest(req.user.userId, body); }
  @Post("requests/:id/respond") respond(@Req() req: any, @Param("id") id: string, @Body() body: { response: ConciergeResponseType; message?: string }) { return this.concierge.respond(req.user.userId, id, body); }
  @Post("requests/:id/cancel") cancel(@Req() req: any, @Param("id") id: string) { return this.concierge.cancel(req.user.userId, id); }
  @Patch("settings") settings(@Req() req: any, @Body() body: { conciergeOptOut: boolean }) { return this.concierge.updateSettings(req.user.userId, body.conciergeOptOut); }
  @Post("orders") async order(@Req() req: any, @Body() body: { serviceId: string; intake?: unknown; memberNotes?: string }) {
    await this.users.requireVerifiedEmail(req.user.userId);
    await this.users.assertNotUnderRiskReview(req.user.userId);
    return this.concierge.createOrder(req.user.userId, body);
  }
  @Get("staff/queue") queue(@Req() req: any) { return this.concierge.staffQueue(req.user.userId); }
  @Post("staff/requests/:id/action") staffAction(@Req() req: any, @Param("id") id: string, @Body() body: { action: "APPROVE" | "REJECT" | "SEND_OUTREACH" | "CLOSE"; notes?: string }) { return this.concierge.staffAction(req.user.userId, id, body); }
}
