import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis only if we have the environment variables
// This prevents build errors if these aren't set locally yet
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Create a sliding window rate limiter: 30 requests per minute
export const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
    })
  : null;

/**
 * Check if the given identifier (usually a user ID or IP) is rate limited.
 * Returns true if allowed, false if blocked.
 */
export async function checkRateLimit(identifier: string): Promise<boolean> {
  if (!ratelimit) {
    // If Redis is not configured, we gracefully allow requests.
    // In production, you'd fail closed or log a massive warning.
    console.warn('⚠️ Upstash Redis is not configured. Rate limiting is DISABLED.');
    return true;
  }

  const { success } = await ratelimit.limit(identifier);
  return success;
}
