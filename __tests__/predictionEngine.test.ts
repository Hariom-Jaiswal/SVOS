import { predictDensityRuleBased, PredictionInput } from '@/lib/engines/predictionEngine';

describe('Prediction Intelligence Engine', () => {
  it('correctly predicts rising density over time based on inflow', () => {
    const input: PredictionInput = {
      currentDensity: 0.5,
      inflowRate: 10,
      outflowRate: 5,
      timeHorizonMinutes: 30,
      eventPhase: 'IN_GAME',
    };

    const futureDensity = predictDensityRuleBased(input);
    // net flow is +5 per minute * 0.5 hours = +2.5
    // Actually timeFactor was input.timeHorizonMinutes / 60
    // so 30 / 60 = 0.5. Net flow formula = (inflow(10) - outflow(5)) * 0.5 = 2.5
    // future = 0.5 + 2.5/100 = 0.525
    expect(futureDensity).toBe(0.525);
  });

  it('multiplies congestion risk during HALFTIME phases', () => {
    const input: PredictionInput = {
      currentDensity: 0.5,
      inflowRate: 10,
      outflowRate: 5,
      timeHorizonMinutes: 30,
      eventPhase: 'HALFTIME',
    };

    const futureDensity = predictDensityRuleBased(input);
    // halftimeSurgeMultiplier = 1.8
    // base surge = 2.5/100 * 1.8 = 0.045
    // total = 0.545
    expect(futureDensity).toBeCloseTo(0.545);
  });

  it('caps max density at 100%', () => {
    const input: PredictionInput = {
      currentDensity: 0.9,
      inflowRate: 200,
      outflowRate: 0,
      timeHorizonMinutes: 60,
      eventPhase: 'IN_GAME',
    };

    const futureDensity = predictDensityRuleBased(input);
    expect(futureDensity).toBe(1.0);
  });
});
