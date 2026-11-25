/**
 * Redis Service
 * Handles all Redis operations for caching, rate limiting, and feature store
 * Gracefully handles connection failures - Redis is optional for development
 */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;
  private isConnected = false;
  private readonly logger = new Logger('RedisService');

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      const redisUrl = this.configService.get('REDIS_URL');
      const redisConfig = redisUrl
        ? redisUrl
        : {
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            db: this.configService.get('REDIS_DB', 0),
            retryStrategy: (times: number) => {
              if (times > 3) return null; // Stop retrying after 3 attempts
              return Math.min(times * 50, 500);
            },
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
          };

      this.redis = new Redis(redisConfig);

      // Handle connection events silently
      this.redis.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Connected to Redis');
      });

      this.redis.on('error', (err: any) => {
        this.isConnected = false;
        // Log only the error once per session, not repeatedly
        if (err.code === 'ECONNREFUSED') {
          this.logger.warn('Redis unavailable - caching disabled (continuing without Redis)');
        } else {
          this.logger.error(`Redis error: ${err.message}`);
        }
      });

      this.redis.on('close', () => {
        this.isConnected = false;
      });

      // Suppress unhandled error events
      this.redis.removeAllListeners('error');
      this.redis.on('error', () => { /* silently ignore */ });
    } catch (error) {
      this.logger.warn('Failed to initialize Redis - continuing without caching');
      this.redis = null;
    }
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.isConnected && this.redis !== null;
  }

  /**
   * Get Redis client for direct access
   */
  getClient(): Redis | null {
    return this.isConnected ? this.redis : null;
  }

  /**
   * Get value from Redis
   */
  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.redis) return null;
    try {
      return await this.redis.get(key);
    } catch (err) {
      this.logger.debug(`Failed to get ${key} from Redis`);
      return null;
    }
  }

  /**
   * Get value as JSON from Redis
   */
  async getJson(key: string): Promise<any> {
    if (!this.isConnected || !this.redis) return null;
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      this.logger.debug(`Failed to get JSON ${key} from Redis`);
      return null;
    }
  }

  /**
   * Set value in Redis with TTL
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isConnected || !this.redis) return;
    try {
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (err) {
      this.logger.debug(`Failed to set ${key} in Redis`);
    }
  }

  /**
   * Set JSON value in Redis with TTL
   */
  async setJson(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isConnected || !this.redis) return;
    try {
      await this.set(key, JSON.stringify(value), ttl);
    } catch (err) {
      this.logger.debug(`Failed to set JSON ${key} in Redis`);
    }
  }

  /**
   * Delete key from Redis
   */
  async delete(key: string): Promise<number> {
    if (!this.isConnected || !this.redis) return 0;
    try {
      return await this.redis.del(key);
    } catch (err) {
      this.logger.debug(`Failed to delete ${key} from Redis`);
      return 0;
    }
  }

  /**
   * Increment counter in Redis
   */
  async increment(key: string, ttl?: number): Promise<number> {
    if (!this.isConnected || !this.redis) return 1;
    try {
      const count = await this.redis.incr(key);
      if (ttl && count === 1) {
        await this.redis.expire(key, ttl);
      }
      return count;
    } catch (err) {
      this.logger.debug(`Failed to increment ${key} in Redis`);
      return 1;
    }
  }

  /**
   * Decrement counter in Redis
   */
  async decrement(key: string): Promise<number> {
    if (!this.isConnected || !this.redis) return 0;
    try {
      return await this.redis.decr(key);
    } catch (err) {
      this.logger.debug(`Failed to decrement ${key} in Redis`);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) return false;
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (err) {
      this.logger.debug(`Failed to check existence of ${key} in Redis`);
      return false;
    }
  }

  /**
   * Get TTL of key
   */
  async getTtl(key: string): Promise<number> {
    if (!this.isConnected || !this.redis) return -2;
    try {
      return await this.redis.ttl(key);
    } catch (err) {
      this.logger.debug(`Failed to get TTL of ${key} from Redis`);
      return -2;
    }
  }

  /**
   * Set TTL of key
   */
  async setTtl(key: string, ttl: number): Promise<void> {
    if (!this.isConnected || !this.redis) return;
    try {
      await this.redis.expire(key, ttl);
    } catch (err) {
      this.logger.debug(`Failed to set TTL of ${key} in Redis`);
    }
  }

  /**
   * Add to set
   */
  async addToSet(key: string, value: string): Promise<number> {
    if (!this.isConnected || !this.redis) return 0;
    try {
      return await this.redis.sadd(key, value);
    } catch (err) {
      this.logger.debug(`Failed to add to set ${key} in Redis`);
      return 0;
    }
  }

  /**
   * Check if value is in set
   */
  async isMemberOfSet(key: string, value: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) return false;
    try {
      const result = await this.redis.sismember(key, value);
      return result === 1;
    } catch (err) {
      this.logger.debug(`Failed to check set membership of ${key} in Redis`);
      return false;
    }
  }

  /**
   * Get all members of set
   */
  async getSetMembers(key: string): Promise<string[]> {
    if (!this.isConnected || !this.redis) return [];
    try {
      return await this.redis.smembers(key);
    } catch (err) {
      this.logger.debug(`Failed to get set members of ${key} from Redis`);
      return [];
    }
  }

  /**
   * Remove from set
   */
  async removeFromSet(key: string, value: string): Promise<number> {
    if (!this.isConnected || !this.redis) return 0;
    try {
      return await this.redis.srem(key, value);
    } catch (err) {
      this.logger.debug(`Failed to remove from set ${key} in Redis`);
      return 0;
    }
  }

  /**
   * Store features for ML
   */
  async storeFeatures(userId: string, features: any, ttl?: number): Promise<void> {
    if (!this.isConnected || !this.redis) return;
    try {
      const key = `features:${userId}`;
      await this.setJson(key, features, ttl || 3600); // 1 hour default
    } catch (err) {
      this.logger.debug(`Failed to store features for ${userId}`);
    }
  }

  /**
   * Get stored features
   */
  async getFeatures(userId: string): Promise<any> {
    const key = `features:${userId}`;
    return this.getJson(key);
  }

  /**
   * Rate limiting - check and increment
   */
  async checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
    const count = await this.get(key);
    const currentCount = count ? parseInt(count) : 0;

    if (currentCount >= limit) {
      return false;
    }

    await this.increment(key, window);
    return true;
  }

  /**
   * Get rate limit remaining
   */
  async getRateLimitRemaining(key: string, limit: number): Promise<number> {
    const count = await this.get(key);
    const currentCount = count ? parseInt(count) : 0;
    return Math.max(0, limit - currentCount);
  }

  /**
   * Cache IP intelligence
   */
  async cacheIpIntel(ip: string, intel: any, ttl: number = 86400): Promise<void> {
    const key = `ip:${ip}:intel`;
    await this.setJson(key, intel, ttl);
  }

  /**
   * Get cached IP intelligence
   */
  async getCachedIpIntel(ip: string): Promise<any> {
    const key = `ip:${ip}:intel`;
    return this.getJson(key);
  }
}
