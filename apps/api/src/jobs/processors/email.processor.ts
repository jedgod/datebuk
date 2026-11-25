import { Injectable, OnModuleInit } from "@nestjs/common";
import { PgBossService } from "../../common/pgboss/pgboss.service";
import { EmailService } from "../../common/email/email.service";

@Injectable()
export class EmailProcessor implements OnModuleInit {
  constructor(private email: EmailService, private pgBoss: PgBossService) {}

  async onModuleInit() {
    await this.pgBoss.work("email", async (job: { data: { to: string; subject: string; text: string } }) => {
      await this.email.send(job.data.to, job.data.subject, job.data.text);
      return { ok: true };
    });
  }
}
