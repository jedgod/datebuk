import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

export interface CreateTicketDto {
  name: string;
  email: string;
  issueType: string;
  message: string;
}

export interface TicketResponse {
  id: string;
  name: string;
  email: string;
  issueType: string;
  message: string;
  status: string;
  createdAt: Date;
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

@Injectable()
export class SupportService {
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialize email transporter
    const emailUser = this.configService.get('EMAIL_USER');
    const emailPass = this.configService.get('EMAIL_PASS');

    if (emailUser && emailPass) {
      this.transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    }
  }

  /**
   * Create a support ticket
   */
  async createTicket(data: CreateTicketDto): Promise<TicketResponse> {
    if (!data.name || !data.email || !data.issueType || !data.message) {
      throw new BadRequestException('All fields are required');
    }

    try {
      // Save ticket to database
      const ticket = await this.prisma.supportTicket.create({
        data: {
          name: data.name,
          email: data.email,
          issueType: data.issueType,
          message: data.message,
          status: 'open',
        },
      });

      // Send confirmation email to user
      if (this.transporter) {
        await this.sendConfirmationEmail(ticket);
      }

      // Notify support team
      if (this.transporter) {
        await this.notifySupportTeam(ticket);
      }

      return {
        id: ticket.id,
        name: ticket.name,
        email: ticket.email,
        issueType: ticket.issueType,
        message: ticket.message,
        status: ticket.status,
        createdAt: ticket.createdAt,
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to create ticket: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Get all tickets (admin only)
   */
  async getAllTickets(status?: string): Promise<TicketResponse[]> {
    try {
      const tickets = await this.prisma.supportTicket.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      return tickets.map(t => ({
        id: t.id,
        name: t.name,
        email: t.email,
        issueType: t.issueType,
        message: t.message,
        status: t.status,
        createdAt: t.createdAt,
      }));
    } catch (error) {
      throw new BadRequestException(
        'Failed to fetch tickets: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Get a specific ticket
   */
  async getTicket(id: string): Promise<TicketResponse> {
    try {
      const ticket = await this.prisma.supportTicket.findUnique({
        where: { id },
      });

      if (!ticket) {
        throw new BadRequestException('Ticket not found');
      }

      return {
        id: ticket.id,
        name: ticket.name,
        email: ticket.email,
        issueType: ticket.issueType,
        message: ticket.message,
        status: ticket.status,
        createdAt: ticket.createdAt,
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to fetch ticket: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    id: string,
    status: string,
  ): Promise<TicketResponse> {
    try {
      const ticket = await this.prisma.supportTicket.update({
        where: { id },
        data: { status },
      });

      // Notify user of status change
      if (this.transporter) {
        await this.sendStatusUpdateEmail(ticket);
      }

      return {
        id: ticket.id,
        name: ticket.name,
        email: ticket.email,
        issueType: ticket.issueType,
        message: ticket.message,
        status: ticket.status,
        createdAt: ticket.createdAt,
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to update ticket: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Send confirmation email to user
   */
  private async sendConfirmationEmail(ticket: any) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_USER'),
        to: ticket.email,
        subject: 'We Received Your Message - DateBuk Support',
        html: `
          <h2>Thank you for contacting DateBuk</h2>
          <p>Hi ${escapeHtml(ticket.name)},</p>
          <p>We have received your support ticket regarding "<strong>${escapeHtml(ticket.issueType)}</strong>".</p>
          <p><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p>Our support team will review your message and get back to you within 24 hours.</p>
          <p><strong>Your Message:</strong></p>
          <p style="background: #f5f5f5; padding: 10px; border-radius: 5px;">${escapeHtml(ticket.message)}</p>
          <p>If you have any additional information, please reply to this email with your ticket ID.</p>
          <p>Thank you,<br/>DateBuk Support Team</p>
        `,
      });
    } catch (err) {
      console.error('Error sending confirmation email:', err);
    }
  }

  /**
   * Notify support team of new ticket
   */
  private async notifySupportTeam(ticket: any) {
    try {
      const supportEmail = this.configService.get('SUPPORT_EMAIL') || 'support@datebuk.com';
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_USER'),
        to: supportEmail,
        subject: `New Support Ticket: ${ticket.issueType}`,
        html: `
          <h2>New Support Ticket Received</h2>
          <p><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p><strong>From:</strong> ${escapeHtml(ticket.name)} (${escapeHtml(ticket.email)})</p>
          <p><strong>Type:</strong> ${escapeHtml(ticket.issueType)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(ticket.message)}</p>
          <p><a href="${this.configService.get('ADMIN_DASHBOARD_URL')}/tickets/${ticket.id}">View in Dashboard</a></p>
        `,
      });
    } catch (err) {
      console.error('Error notifying support team:', err);
    }
  }

  /**
   * Send status update email to user
   */
  private async sendStatusUpdateEmail(ticket: any) {
    try {
      const statusMessages = {
        open: 'Your ticket is being reviewed by our team.',
        in_progress: 'We are working on resolving your issue.',
        resolved: 'Your issue has been resolved. Please let us know if you need further assistance.',
        closed: 'Your ticket has been closed.',
      };

      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_USER'),
        to: ticket.email,
        subject: `Ticket Update - ${ticket.id}`,
        html: `
          <h2>Support Ticket Update</h2>
          <p>Hi ${escapeHtml(ticket.name)},</p>
          <p><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p><strong>Status:</strong> ${escapeHtml(ticket.status)}</p>
          <p>${statusMessages[ticket.status] || 'Your ticket status has been updated.'}</p>
          <p>Thank you for choosing DateBuk!<br/>Support Team</p>
        `,
      });
    } catch (err) {
      console.error('Error sending status update email:', err);
    }
  }
}
