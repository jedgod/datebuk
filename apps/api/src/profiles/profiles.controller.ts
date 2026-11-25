import { Body, Controller, Patch, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { ProfilesService } from "./profiles.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller("profiles")
export class ProfilesController {
  constructor(private profiles: ProfilesService) {}

  @UseGuards(JwtAuthGuard)
  @Patch("me")
  async update(@Req() req: any, @Body() body: UpdateProfileDto) {
    // Photos can be saved during onboarding, before the email is verified: signup collects
    // them in the same flow, and a new account has to be able to finish its profile. Every
    // key must still be an upload this user completed (ProfilesService -> assertUploadOwnedBy),
    // and at most 6 are accepted (UpdateProfileDto). Anything that exposes members to each
    // other (recommendations, swipes) keeps its own verified-email requirement.
    return this.profiles.updateMe(req.user.userId, body);
  }
}
