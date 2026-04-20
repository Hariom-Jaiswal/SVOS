import { CROWD_WEIGHTS, CONGESTION_THRESHOLDS, TREND_THRESHOLDS } from '../constants';

/**
 * Metric vector for a specific venue zone
 *
 * DESIGN DECISION: SEPARATION OF CONCERNS
 * This interface represents the "Sense" layer output. By isolating raw data
 * from the scoring logic, we ensure the engine can be unit-tested without
 * browser dependencies or real-time sensor noise.
 */
export interface ZoneMetrics {
  zoneId: string;
  /** Fraction of capacity (0-1) */
  density: number;
  /** Average movement speed in m/s */
  velocity: number;
  /** People entering per minute */
  inflowRate: number;
  /** People leaving per minute */
  outflowRate: number;
  /** UNIX timestamp of reading */
  timestamp: number;
}

/**
 * Computed safety and congestion score
 */
export interface CrowdScore {
  rawScore: number;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  /** Normalized safety index (0-100) */
  riskScore: number;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
}

/**
 * Calculates a weighted crowd risk score based on density, velocity, and inflow.
 *
 * @param metrics - The raw metrics of the zone
 * @returns The calculated CrowdScore object
 */
export function calculateCrowdScore(metrics: ZoneMetrics): CrowdScore {
  // Velocity is inverted: slow movement (0 m/s) = higher risk factor (1)
  // Assumes 2.0 m/s is full flow speed
  const normalizedVelocity = 1 - Math.min(metrics.velocity / 2.0, 1);

  const rawScore =
    CROWD_WEIGHTS.DENSITY * metrics.density +
    CROWD_WEIGHTS.VELOCITY * normalizedVelocity +
    CROWD_WEIGHTS.INFLOW * Math.min(metrics.inflowRate / 100, 1);

  // Clamp risk score between 0 and 100
  const riskScore = Math.max(0, Math.min(100, Math.round(rawScore * 100)));

  let congestionLevel: CrowdScore['congestionLevel'];
  if (riskScore < CONGESTION_THRESHOLDS.LOW) congestionLevel = 'LOW';
  else if (riskScore < CONGESTION_THRESHOLDS.MEDIUM) congestionLevel = 'MEDIUM';
  else if (riskScore < CONGESTION_THRESHOLDS.HIGH) congestionLevel = 'HIGH';
  else congestionLevel = 'CRITICAL';

  return { rawScore, congestionLevel, riskScore, trend: 'STABLE' };
}

/**
 * Attaches a trend indicator by comparing the current score with a previous reading.
 *
 * @param current - The latest calculated score
 * @param previous - The score from the previous time step
 * @returns The score updated with trend movement
 */
export function attachTrend(current: CrowdScore, previous: CrowdScore | null): CrowdScore {
  if (!previous) return { ...current, trend: 'STABLE' };
  const delta = current.riskScore - previous.riskScore;
  const trend =
    delta > TREND_THRESHOLDS.STABLE
      ? 'WORSENING'
      : delta < -TREND_THRESHOLDS.STABLE
        ? 'IMPROVING'
        : 'STABLE';
  return { ...current, trend };
}
