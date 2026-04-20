import { calculateCrowdScore } from '../lib/engines/crowdEngine';
import { predictDensityRuleBased } from '../lib/engines/predictionEngine';
import { evaluateNudges } from '../lib/engines/nudgeEngine';

/**
 * INTEGRATION TEST: SENSE -> PREDICT -> ACT
 *
 * This suite verifies the core "Intelligence Loop" of SVOS.
 * It simulates a venue state where sensors detect rising congestion,
 * the prediction engine forecasts critical levels, and the nudge
 * engine decides to trigger a safety alert.
 */
describe('SVOS Intelligence Loop [Sense-Predict-Act]', () => {
  it('triggers a safety nudge when predicted density exceeds critical threshold', () => {
    // 1. SENSE: Raw metrics indicate rising load at the North Gate
    const rawMetrics = {
      zoneId: 'Z_NTH',
      density: 0.75, // Already high
      velocity: 0.5, // Slowing down
      inflowRate: 150, // High inflow
      outflowRate: 20,
      timestamp: Date.now(),
    };

    const currentScore = calculateCrowdScore(rawMetrics);
    expect(currentScore.congestionLevel).toBe('HIGH');

    // 2. PREDICT: Forecast 15 minutes into the future
    const predictedDensity = predictDensityRuleBased({
      currentDensity: currentScore.rawScore,
      inflowRate: rawMetrics.inflowRate,
      outflowRate: rawMetrics.outflowRate,
      timeHorizonMinutes: 15,
      eventPhase: 'HALFTIME',
    });

    // Forecasted risk should be critical due to halftime surge and high net flow
    expect(predictedDensity).toBeGreaterThan(0.9);

    // 3. ACT: Determine if a safety nudge is needed based on the forecast
    // We mock the context with the predicted score
    const nudge = evaluateNudges({
      uid: 'staff-001',
      currentZone: 'Z_NTH',
      zoneScore: {
        ...currentScore,
        rawScore: predictedDensity,
        congestionLevel: 'CRITICAL',
        riskScore: Math.round(predictedDensity * 100),
      },
      nearbyZones: [
        {
          id: 'Z_FDC',
          name: 'Food Court',
          score: { rawScore: 0.2, congestionLevel: 'LOW', riskScore: 20, trend: 'STABLE' },
        },
      ],
      lastNudgeSentAt: 0,
      preferences: { accessibility: false, language: 'en' },
    });

    expect(nudge).not.toBeNull();
    expect(nudge?.type).toBe('SAFETY_ALERT');
    expect(nudge?.priority).toBe('URGENT');
    expect(nudge?.message).toContain('Food Court'); // Routing to safer zone
  });
});
