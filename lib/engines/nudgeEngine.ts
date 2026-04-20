import { CrowdScore } from './crowdEngine';

export type NudgeType =
  | 'ROUTE_SUGGESTION'
  | 'QUEUE_ALERT'
  | 'VENDOR_DEAL'
  | 'EXIT_TIMING'
  | 'SAFETY_ALERT';

export interface Nudge {
  type: NudgeType;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expiresAt: number;
}

export interface ZoneWithScore {
  id: string;
  name: string;
  score: CrowdScore;
}

export interface UserPreferences {
  accessibility: boolean;
  language: string;
}

export interface NudgeContext {
  uid: string;
  currentZone: string;
  zoneScore: CrowdScore;
  nearbyZones: ZoneWithScore[];
  lastNudgeSentAt: number;
  preferences: UserPreferences;
}

// Cooldown periods per nudge type (prevents notification spam)
const COOLDOWN_MS: Record<NudgeType, number> = {
  ROUTE_SUGGESTION: 3 * 60 * 1000, // 3 minutes
  QUEUE_ALERT: 5 * 60 * 1000, // 5 minutes
  VENDOR_DEAL: 10 * 60 * 1000, // 10 minutes
  EXIT_TIMING: 8 * 60 * 1000, // 8 minutes
  SAFETY_ALERT: 0, // No cooldown - always send safety
};

function getSafeZone(zones: ZoneWithScore[]): string {
  const safeZones = zones.filter(
    (z) => z.score.congestionLevel === 'LOW' || z.score.congestionLevel === 'MEDIUM',
  );
  if (safeZones.length > 0) {
    // Return the one with lowest risk
    safeZones.sort((a, b) => a.score.riskScore - b.score.riskScore);
    return safeZones[0].name;
  }
  return 'Nearest Exit';
}

export function evaluateNudges(context: NudgeContext): Nudge | null {
  const now = Date.now();

  // 1. SAFETY - highest priority, always fires
  if (context.zoneScore.congestionLevel === 'CRITICAL') {
    return {
      type: 'SAFETY_ALERT',
      message: `⚠️ Your area is overcrowded. Move to ${getSafeZone(context.nearbyZones)} now.`,
      actionLabel: 'Show safe route',
      actionRoute: `/navigate?to=safe`, // Would dynamically map to best safe zone ID
      priority: 'URGENT',
      expiresAt: now + 120000,
    };
  }

  // 2. ROUTE SUGGESTION - when nearby zone is much less crowded
  const quieterZone = context.nearbyZones.find(
    (z) => z.score.riskScore < context.zoneScore.riskScore - 30,
  );

  if (quieterZone && now - context.lastNudgeSentAt > COOLDOWN_MS.ROUTE_SUGGESTION) {
    return {
      type: 'ROUTE_SUGGESTION',
      message: `${quieterZone.name} is much quieter right now. (~2 min walk)`,
      actionLabel: 'Take me there',
      actionRoute: `/navigate?to=${quieterZone.id}`,
      priority: 'MEDIUM',
      expiresAt: now + 180000,
    };
  }

  // 3. VENDOR DEAL - Mocked for phase 3, could be dynamic
  const hasLowWaitVendor = context.nearbyZones.some((z) => z.score.congestionLevel === 'LOW');
  if (hasLowWaitVendor && now - context.lastNudgeSentAt > COOLDOWN_MS.VENDOR_DEAL) {
    return {
      type: 'VENDOR_DEAL',
      message: `Food stations near you have low wait times! Grab something now.`,
      actionLabel: 'View Vendors',
      actionRoute: `/vendors`,
      priority: 'LOW',
      expiresAt: now + 600000,
    };
  }

  return null;
}
