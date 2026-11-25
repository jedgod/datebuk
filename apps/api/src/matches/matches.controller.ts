import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { MatchesService } from "./matches.service";

@Controller("matches")
export class MatchesController {
  constructor(private matches: MatchesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: any) {
    return this.matches.listForUser(req.user.userId);
  }
}
