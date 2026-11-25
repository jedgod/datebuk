import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class EmailService {
  private logger = new Logger(EmailService.name);

  async send(to: string, subject: string, text: string) {
    // Industrial baseline: integrate nodemailer/SES/SendGrid.
    // For now: safe fallback to logs so dev works without creds.
    this.logger.log(`[EMAIL] To=${to} Subject="${subject}"\n${text}`);
  }
}
