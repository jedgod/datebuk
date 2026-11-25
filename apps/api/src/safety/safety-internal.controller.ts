import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { InternalKeyGuard } from "./guards/internal-key.guard";
import { SafetyService } from "./safety.service";

// Called by apps/signaling's join-room handler before it lets a second participant into
// a call room, so a blocked pair can't reach each other over a fresh room ID even though
// signaling itself has no database access. See apps/signaling/src/index.ts.
@Controller("internal/safety")
@UseGuards(InternalKeyGuard)
export class SafetyInternalController {
  constructor(private safety: SafetyService) {}

  @Get("blocked")
  async blocked(@Query("userA") userA: string, @Query("userB") userB: string) {
    const blocked = userA && userB ? await this.safety.internalCheckBlocked(userA, userB) : false;
    return { blocked };
  }
}
