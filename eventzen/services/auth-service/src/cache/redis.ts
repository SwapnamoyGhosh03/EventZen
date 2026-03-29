import Redis from 'ioredis';
import { config } from '../config';
import logger from '../utils/logger';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { error: err.message }));

export async function blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
  await redis.set(`bl:${jti}`, '1', 'EX', ttlSeconds);
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const result = await redis.get(`bl:${jti}`);
  return result !== null;
}

export async function cacheUserProfile(userId: string, profile: object): Promise<void> {
  await redis.set(`user:${userId}:profile`, JSON.stringify(profile), 'EX', 300);
}

export async function getCachedUserProfile(userId: string): Promise<object | null> {
  const cached = await redis.get(`user:${userId}:profile`);
  return cached ? JSON.parse(cached) : null;
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await redis.del(`user:${userId}:profile`);
  await redis.del(`user:${userId}:roles`);
}

export async function checkLoginRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate:login:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 900); // 15 minutes
  }
  return { allowed: count <= 5, remaining: Math.max(0, 5 - count) };
}

export async function storeOtp(email: string, otp: string): Promise<void> {
  await redis.set(`otp:${email}`, otp, 'EX', 600); // 10 minutes
}

export async function getOtp(email: string): Promise<string | null> {
  return await redis.get(`otp:${email}`);
}

export async function deleteOtp(email: string): Promise<void> {
  await redis.del(`otp:${email}`);
}

export default redis;
