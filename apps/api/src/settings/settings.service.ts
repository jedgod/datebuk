import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

export interface SettingsPayload {
  notifications: { push: boolean; email: boolean; messages: boolean };
  privacy: { profileVisible: boolean; showDistance: boolean; showAge: boolean };
  realtime: { enabled: boolean };
}

function toPayload(row: {
  notifyPush: boolean;
  notifyEmail: boolean;
  notifyMessages: boolean;
  privacyProfileVisible: boolean;
  privacyShowDistance: boolean;
  privacyShowAge: boolean;
  realtimeEnabled: boolean;
}): SettingsPayload {
  return {
    notifications: { push: row.notifyPush, email: row.notifyEmail, messages: row.notifyMessages },
    privacy: {
      profileVisible: row.privacyProfileVisible,
      showDistance: row.privacyShowDistance,
      showAge: row.privacyShowAge,
    },
    realtime: { enabled: row.realtimeEnabled },
  };
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getForUser(userId: string): Promise<SettingsPayload> {
    const row = await this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    return toPayload(row);
  }

  async updateForUser(userId: string, patch: Partial<SettingsPayload>): Promise<SettingsPayload> {
    const existing = await this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    const merged = toPayload(existing);

    const next: SettingsPayload = {
      notifications: { ...merged.notifications, ...patch.notifications },
      privacy: { ...merged.privacy, ...patch.privacy },
      realtime: { ...merged.realtime, ...patch.realtime },
    };

    const row = await this.prisma.userSettings.update({
      where: { userId },
      data: {
        notifyPush: next.notifications.push,
        notifyEmail: next.notifications.email,
        notifyMessages: next.notifications.messages,
        privacyProfileVisible: next.privacy.profileVisible,
        privacyShowDistance: next.privacy.showDistance,
        privacyShowAge: next.privacy.showAge,
        realtimeEnabled: next.realtime.enabled,
      },
    });

    return toPayload(row);
  }
}
