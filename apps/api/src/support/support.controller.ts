import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SupportService, CreateTicketDto } from './support.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';

@Controller('support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  // Unauthenticated contact-form endpoint sends 2 emails per call (confirmation
  // + support-team notify) — throttled tighter than the global default to limit
  // email-relay/spam abuse.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('tickets')
  async createTicket(@Body() data: CreateTicketDto) {
    return this.supportService.createTicket(data);
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ADMIN_VIEW_SUPPORT')
  async getAllTickets() {
    return this.supportService.getAllTickets();
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ADMIN_VIEW_SUPPORT')
  async getTicket(@Param('id') id: string) {
    return this.supportService.getTicket(id);
  }

  @Patch('tickets/:id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ADMIN_MANAGE_SUPPORT')
  async updateTicketStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.supportService.updateTicketStatus(id, status);
  }
}
