export interface ZoneMetrics {
  zoneId: string;
  density: number; // 0-1 (fraction of capacity)
  velocity: number; // movement speed (m/s avg)
  inflowRate: number; // people entering per minute
  outflowRate: number; // people leaving per minute
  timestamp: number;
}

export interface CrowdScore {
  rawScore: number;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0-100
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
}

// Weights tuned from historical event data
const WEIGHTS = {
  density: 0.5,
  velocity: 0.2, // Low velocity = stuck crowd = higher risk
  inflow: 0.3,
};

export function calculateCrowdScore(metrics: ZoneMetrics): CrowdScore {
  // Velocity is inverted: slow movement = higher risk
  const normalizedVelocity = 1 - Math.min(metrics.velocity / 2.0, 1);

  const rawScore =
    WEIGHTS.density * metrics.density +
    WEIGHTS.velocity * normalizedVelocity +
    WEIGHTS.inflow * Math.min(metrics.inflowRate / 100, 1);

  const riskScore = Math.min(100, Math.round(rawScore * 100));

  let congestionLevel: CrowdScore['congestionLevel'];
  if (riskScore < 30) congestionLevel = 'LOW';
  else if (riskScore < 60) congestionLevel = 'MEDIUM';
  else if (riskScore < 85) congestionLevel = 'HIGH';
  else congestionLevel = 'CRITICAL';

  return { rawScore, congestionLevel, riskScore, trend: 'STABLE' };
}

export function attachTrend(current: CrowdScore, previous: CrowdScore | null): CrowdScore {
  if (!previous) return { ...current, trend: 'STABLE' };
  const delta = current.riskScore - previous.riskScore;
  const trend = delta > 5 ? 'WORSENING' : delta < -5 ? 'IMPROVING' : 'STABLE';
  return { ...current, trend };
}
