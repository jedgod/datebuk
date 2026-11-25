import { Injectable, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        refreshTokenId: true,
        createdAt: true,
        updatedAt: true,
        revokedAt: true,
        rotatedAt: true,
        ip: true,
        userAgent: true,
        reuseDetectedAt: true,
      },
    });
  }

  async revoke(userId: string, sessionId: string) {
    const s = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!s) throw new BadRequestException("Session not found");
    if (s.userId !== userId) throw new ForbiddenException();
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
    return { ok: true };
  }
}
