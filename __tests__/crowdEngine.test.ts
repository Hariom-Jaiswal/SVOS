import { calculateCrowdScore, attachTrend, ZoneMetrics } from '../lib/engines/crowdEngine';

describe('Crowd Intelligence Engine', () => {
  it('correctly categorizes low congestion', () => {
    const metrics: ZoneMetrics = {
      zoneId: 'test_zone',
      density: 0.1, // 10%
      velocity: 1.5, // fast moving
      inflowRate: 10,
      outflowRate: 15,
      timestamp: Date.now(),
    };

    const score = calculateCrowdScore(metrics);
    expect(score.congestionLevel).toBe('LOW');
    expect(score.riskScore).toBeLessThan(30);
  });

  it('detects critical crowd scenarios', () => {
    const metrics: ZoneMetrics = {
      zoneId: 'danger_zone',
      density: 0.95, // 95% full
      velocity: 0.2, // slow moving / stuck
      inflowRate: 150, // high inflow
      outflowRate: 10,
      timestamp: Date.now(),
    };

    const score = calculateCrowdScore(metrics);
    expect(score.congestionLevel).toBe('CRITICAL');
    expect(score.riskScore).toBeGreaterThanOrEqual(85);
  });

  it('determines WORSENING trend when score heavily increases', () => {
    const previous = {
      rawScore: 0.3,
      congestionLevel: 'LOW' as const,
      riskScore: 30,
      trend: 'STABLE' as const,
    };
    const current = {
      rawScore: 0.6,
      congestionLevel: 'MEDIUM' as const,
      riskScore: 60,
      trend: 'STABLE' as const,
    };

    const trenched = attachTrend(current, previous);
    expect(trenched.trend).toBe('WORSENING');
  });
});
