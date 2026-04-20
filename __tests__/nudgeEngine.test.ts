import { evaluateNudges, NudgeContext } from '@/lib/engines/nudgeEngine';

describe('Smart Nudging Engine', () => {
  const mockContext: NudgeContext = {
    uid: 'user_123',
    currentZone: 'Zone A',
    zoneScore: { rawScore: 0.2, congestionLevel: 'LOW', riskScore: 20, trend: 'STABLE' },
    nearbyZones: [
      {
        id: 'zone_B',
        name: 'Zone B',
        score: { rawScore: 0.1, congestionLevel: 'LOW', riskScore: 10, trend: 'STABLE' },
      },
    ],
    lastNudgeSentAt: 0,
    preferences: { accessibility: false, language: 'en' },
  };

  it('triggers SAFETY_ALERT for critical congestion', () => {
    const context: NudgeContext = {
      ...mockContext,
      zoneScore: { rawScore: 0.9, congestionLevel: 'CRITICAL', riskScore: 90, trend: 'STABLE' },
    };

    const nudge = evaluateNudges(context);
    expect(nudge?.type).toBe('SAFETY_ALERT');
    expect(nudge?.priority).toBe('URGENT');
  });

  it('triggers ROUTE_SUGGESTION when a significantly quieter zone is nearby', () => {
    const context: NudgeContext = {
      ...mockContext,
      zoneScore: { rawScore: 0.6, congestionLevel: 'MEDIUM', riskScore: 60, trend: 'STABLE' },
      nearbyZones: [
        {
          id: 'zone_quiet',
          name: 'Quiet Zone',
          score: { rawScore: 0.1, congestionLevel: 'LOW', riskScore: 10, trend: 'STABLE' },
        },
      ],
    };

    const nudge = evaluateNudges(context);
    expect(nudge?.type).toBe('ROUTE_SUGGESTION');
    expect(nudge?.priority).toBe('MEDIUM');
  });

  it('respects cooldown periods', () => {
    const now = Date.now();
    const context: NudgeContext = {
      ...mockContext,
      zoneScore: { rawScore: 0.6, congestionLevel: 'MEDIUM', riskScore: 60, trend: 'STABLE' },
      nearbyZones: [
        {
          id: 'zone_quiet',
          name: 'Quiet Zone',
          score: { rawScore: 0.1, congestionLevel: 'LOW', riskScore: 10, trend: 'STABLE' },
        },
      ],
      lastNudgeSentAt: now - 1000, // Only 1 second ago
    };

    // ROUTE_SUGGESTION has a 3 min cooldown
    const nudge = evaluateNudges(context);
    expect(nudge).toBeNull();
  });

  it('always sends SAFETY_ALERT even during cooldown', () => {
    const now = Date.now();
    const context: NudgeContext = {
      ...mockContext,
      zoneScore: { rawScore: 0.9, congestionLevel: 'CRITICAL', riskScore: 90, trend: 'STABLE' },
      lastNudgeSentAt: now - 1000,
    };

    const nudge = evaluateNudges(context);
    expect(nudge?.type).toBe('SAFETY_ALERT');
  });
});
