import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../database/prisma.service';
import { logger } from '../common/logging/logger';

/**
 * IP Intelligence Service
 * Fetches IP geolocation, reputation, and threat data
 */

export interface IpIntelligenceData {
  ip: string;
  country: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isVpn: boolean;
  isProxy: boolean;
  isDatacenter: boolean;
  threatLevel: 'low' | 'medium' | 'high' | 'unknown';
  isp?: string;
  timestamp: number;
  /**
   * True when we could NOT actually reach the provider (no API key configured, or the
   * call errored/timed out) — as opposed to a verified "this IP is clean" result. Callers
   * that gate access on isVpn/isProxy must check this first: treating a failed lookup as
   * "verified clean" is exactly the fail-open bug this field exists to prevent. Policy is
   * the caller's choice (e.g. AuthService fails open on availability grounds for signup/
   * login rather than blocking everyone during a provider outage, but must never confuse
   * "unknown" with "confirmed not a VPN").
   */
  lookupFailed: boolean;
}

@Injectable()
export class IpIntelligenceService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Get IP intelligence from external API
   */
  async getIpIntelligence(ip: string): Promise<IpIntelligenceData> {
    try {
      // Try to use IPQualityScore or similar service
      const apiKey = this.configService.get('IP_API_KEY');
      if (!apiKey) {
        logger.warn({ msg: 'ip_api_key_not_configured' });
        return this.getBasicIpData(ip);
      }

      const endpoint = `https://ipapi.is/json/?ip=${ip}&key=${apiKey}`;
      const response = await lastValueFrom(this.httpService.get(endpoint));

      return this.parseIpResponse(ip, response.data);
    } catch (error) {
      logger.error({ msg: 'ip_intelligence_lookup_failed', err: (error as Error)?.message });
      return this.getBasicIpData(ip);
    }
  }

  /**
   * Parse response from IP API
   */
  private parseIpResponse(ip: string, data: any): IpIntelligenceData {
    return {
      ip,
      country: data.country || 'Unknown',
      city: data.city || undefined,
      latitude: data.latitude,
      longitude: data.longitude,
      isVpn: data.is_vpn || false,
      isProxy: data.is_proxy || false,
      isDatacenter: data.is_datacenter || false,
      threatLevel: this.determineThreatLevel(data),
      isp: data.isp || undefined,
      timestamp: Date.now(),
      lookupFailed: false,
    };
  }

  /**
   * Determine threat level from IP data
   */
  private determineThreatLevel(data: any): 'low' | 'medium' | 'high' | 'unknown' {
    if (data.threat_level === 'high') return 'high';
    if (data.threat_level === 'medium') return 'medium';
    if (data.threat_level === 'low') return 'low';

    // Heuristic: VPN + Datacenter = risky
    if ((data.is_vpn || data.is_proxy) && data.is_datacenter) {
      return 'medium';
    }

    return 'unknown';
  }

  /**
   * Fallback: Basic IP data without external API
   */
  private getBasicIpData(ip: string): IpIntelligenceData {
    return {
      ip,
      country: 'Unknown',
      isVpn: false,
      isProxy: false,
      isDatacenter: false,
      threatLevel: 'unknown',
      timestamp: Date.now(),
      lookupFailed: true,
    };
  }

  /**
   * Check if IP is in blacklist
   */
  async isBlacklisted(ip: string): Promise<boolean> {
    const entry = await this.prisma.ipBlacklist.findUnique({ where: { ip } });
    if (!entry || !entry.blocked) return false;
    if (entry.expiresAt && entry.expiresAt <= new Date()) return false;
    return true;
  }

  /**
   * Add IP to blacklist
   */
  async blacklistIp(ip: string, reason: string, addedBy?: string): Promise<void> {
    await this.prisma.ipBlacklist.upsert({
      where: { ip },
      update: { blocked: true, reason, addedBy },
      create: { ip, reason, addedBy },
    });
  }
}
