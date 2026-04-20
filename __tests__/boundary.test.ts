import { calculateCrowdScore } from '../lib/engines/crowdEngine';
import { predictDensityRuleBased } from '../lib/engines/predictionEngine';
import { evaluateNudges } from '../lib/engines/nudgeEngine';

describe('Boundary & Edge Case Analysis', () => {
  describe('Crowd Engine Boundaries', () => {
    it('handles negative metrics by clamping or producing valid scores', () => {
      const negativeMetrics = {
        zoneId: 'error-zone',
        density: -0.5,
        velocity: -1.0,
        inflowRate: -100,
        outflowRate: -50,
        timestamp: Date.now(),
      };

      const score = calculateCrowdScore(negativeMetrics);
      expect(score.riskScore).toBeGreaterThanOrEqual(0);
      expect(score.riskScore).toBeLessThanOrEqual(100);
    });

    it('handles extreme density values (over-capacity)', () => {
      const overCapacity = {
        zoneId: 'overflow',
        density: 5.0, // 500% capacity
        velocity: 0.1,
        inflowRate: 1000,
        outflowRate: 0,
        timestamp: Date.now(),
      };

      const score = calculateCrowdScore(overCapacity);
      expect(score.riskScore).toBe(100);
      expect(score.congestionLevel).toBe('CRITICAL');
    });
  });

  describe('Prediction Engine Boundaries', () => {
    it('never predicts negative density even with huge outflow', () => {
      const highOutflow = {
        currentDensity: 0.1,
        inflowRate: 0,
        outflowRate: 10000,
        timeHorizonMinutes: 60,
        eventPhase: 'POST_GAME' as const,
      };

      const predicted = predictDensityRuleBased(highOutflow);
      expect(predicted).toBe(0);
    });

    it('caps future density at 1.0 during halftime surges', () => {
      const peakInflow = {
        currentDensity: 0.9,
        inflowRate: 5000,
        outflowRate: 0,
        timeHorizonMinutes: 10,
        eventPhase: 'HALFTIME' as const,
      };

      const predicted = predictDensityRuleBased(peakInflow);
      expect(predicted).toBe(1.0);
    });
  });

  describe('Nudge Engine Boundaries', () => {
    it('returns null if there are no nearby zones available', () => {
      const context = {
        uid: 'user-1',
        currentZone: 'A',
        zoneScore: {
          rawScore: 0.5,
          congestionLevel: 'MEDIUM' as const,
          riskScore: 50,
          trend: 'STABLE' as const,
        },
        nearbyZones: [],
        lastNudgeSentAt: 0,
        preferences: { accessibility: false, language: 'en' },
      };

      const nudge = evaluateNudges(context);
      expect(nudge).toBeNull();
    });

    it('always triggers safety alerts regardless of cooldown', () => {
      const context = {
        uid: 'user-1',
        currentZone: 'A',
        zoneScore: {
          rawScore: 0.9,
          congestionLevel: 'CRITICAL' as const,
          riskScore: 95,
          trend: 'WORSENING' as const,
        },
        nearbyZones: [
          {
            id: 'B',
            name: 'Zone B',
            score: {
              rawScore: 0.1,
              congestionLevel: 'LOW' as const,
              riskScore: 10,
              trend: 'STABLE' as const,
            },
          },
        ],
        lastNudgeSentAt: Date.now() - 100, // Very recent
        preferences: { accessibility: false, language: 'en' },
      };

      const nudge = evaluateNudges(context);
      expect(nudge?.type).toBe('SAFETY_ALERT');
    });
  });
});
