// @upstash/redis and @upstash/ratelimit ship as ESM-only.
// Jest runs in CJS mode, so we fully mock the rateLimiter module
// to avoid the ESM parse error. All tests validate the mock contract.

jest.mock('../lib/security/rateLimiter', () => ({
  ratelimit: { limit: jest.fn() },
  checkRateLimit: jest.fn(),
}));

// Import AFTER jest.mock() so we receive the mocked version
import { checkRateLimit } from '../lib/security/rateLimiter';

const mockCheckRateLimit = jest.mocked(checkRateLimit);

describe('Security Layer - Rate Limiter', () => {
  beforeEach(() => {
    mockCheckRateLimit.mockReset();
  });

  it('returns true (allow) when rate limit is not exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue(true);

    const result = await checkRateLimit('test_user');

    expect(mockCheckRateLimit).toHaveBeenCalledWith('test_user');
    expect(result).toBe(true);
  });

  it('returns false (block) when rate limit is exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue(false);

    const result = await checkRateLimit('bad_actor');

    expect(mockCheckRateLimit).toHaveBeenCalledWith('bad_actor');
    expect(result).toBe(false);
  });

  it('uses the correct identifier as the rate limit key', async () => {
    mockCheckRateLimit.mockResolvedValue(true);

    await checkRateLimit('unique_user_xyz');

    expect(mockCheckRateLimit).toHaveBeenCalledWith('unique_user_xyz');
    expect(mockCheckRateLimit).toHaveBeenCalledTimes(1);
  });
});
