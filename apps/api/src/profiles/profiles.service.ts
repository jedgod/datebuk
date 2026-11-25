import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { UploadsService } from "../uploads/uploads.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

// DTO seeking value -> User.genderPreference enum (the same three values).
const SEEKING_TO_PREFERENCE = { MEN: "MEN", WOMEN: "WOMEN", EVERYONE: "EVERYONE" } as const;

@Injectable()
export class ProfilesService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
  ) {}

  async updateMe(userId: string, data: UpdateProfileDto) {
    const photos = data.photos;
    for (const key of photos ?? []) {
      await this.uploads.assertUploadOwnedBy(userId, key);
    }
    if (typeof data.voiceIntroKey === "string") {
      await this.uploads.assertUploadOwnedBy(userId, data.voiceIntroKey);
    }

    const city = typeof data.location?.city === "string" ? (data.location.city as string).slice(0, 120) : undefined;

    // The Profile row is what the app reads for display; the User row carries the same
    // fields for matching/search (gender, genderPreference, ...), so both are written together.
    const [profile] = await this.prisma.$transaction([
      this.prisma.profile.upsert({
        where: { userId },
        update: {
          displayName: data.displayName ?? undefined,
          age: data.age ?? undefined,
          gender: data.gender ? data.gender.toLowerCase() : undefined,
          bio: data.bio ?? undefined,
          photos,
          voiceIntroKey: data.voiceIntroKey ?? undefined,
          location: (data.location as any) ?? undefined,
        },
        create: {
          userId,
          displayName: data.displayName ?? "User",
          age: data.age ?? 18,
          gender: data.gender ? data.gender.toLowerCase() : undefined,
          bio: data.bio ?? null,
          photos: photos ?? [],
          voiceIntroKey: data.voiceIntroKey ?? null,
          location: (data.location as any) ?? undefined,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          displayName: data.displayName ?? undefined,
          bio: data.bio ?? undefined,
          photos,
          gender: data.gender ?? undefined,
          genderPreference: data.seeking ? SEEKING_TO_PREFERENCE[data.seeking] : undefined,
          sexualOrientation: data.sexualOrientation ?? undefined,
          relationshipGoal: data.relationshipGoal ?? undefined,
          heightCm: data.heightCm ?? undefined,
          locationCity: city,
        },
      }),
    ]);
    return profile;
  }
}
