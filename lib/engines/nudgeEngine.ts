import { CrowdScore } from './crowdEngine';
import { COOLDOWN_PERIODS_MS } from '../constants';

/**
 * Valid types of attendee notifications
 */
export type NudgeType =
  | 'ROUTE_SUGGESTION'
  | 'QUEUE_ALERT'
  | 'VENDOR_DEAL'
  | 'EXIT_TIMING'
  | 'SAFETY_ALERT';

/**
 * A recommendation or alert sent to an attendee
 */
export interface Nudge {
  type: NudgeType;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  /** Time when the nudge should no longer be displayed */
  expiresAt: number;
}

/**
 * Metadata for a venue zone and its current score
 */
export interface ZoneWithScore {
  id: string;
  name: string;
  score: CrowdScore;
}

/**
 * Attendee-specific preferences for personalization
 */
export interface UserPreferences {
  accessibility: boolean;
  language: string;
}

/**
 * Context required to determine relevant nudges
 */
export interface NudgeContext {
  uid: string;
  currentZone: string;
  zoneScore: CrowdScore;
  nearbyZones: ZoneWithScore[];
  /** When the last nudge of any type was sent to this user */
  lastNudgeSentAt: number;
  preferences: UserPreferences;
}

/**
 * Finds the safest nearby zone (lowest congestion) to route an attendee.
 *
 * @param zones - List of neighboring zones
 * @returns The name of the safest zone or a generic exit string
 */
function getSafeZone(zones: ZoneWithScore[]): string {
  const safeZones = zones.filter(
    (z) => z.score.congestionLevel === 'LOW' || z.score.congestionLevel === 'MEDIUM',
  );
  if (safeZones.length > 0) {
    // Return the one with lowest risk score
    safeZones.sort((a, b) => a.score.riskScore - b.score.riskScore);
    return safeZones[0].name;
  }
  return 'Nearest Exit';
}

/**
 * Evaluates the user context against rules to determine if a nudge is necessary.
 * Priority: Safety > Route Suggestion > Vendor Deals.
 *
 * @param context - The current state of the attendee and surroundings
 * @returns A relevant Nudge or null if none are triggered
 */
export function evaluateNudges(context: NudgeContext): Nudge | null {
  const now = Date.now();

  // Rule 1: CRITICAL SAFETY - Highest priority, bypasses cooldown
  if (context.zoneScore.congestionLevel === 'CRITICAL') {
    return {
      type: 'SAFETY_ALERT',
      message: `⚠️ Your area is overcrowded. Move to ${getSafeZone(context.nearbyZones)} now.`,
      actionLabel: 'Show safe route',
      actionRoute: `/navigate?to=safe`,
      priority: 'URGENT',
      expiresAt: now + 120000,
    };
  }

  // Rule 2: ROUTE SUGGESTION - Triggered when a nearby zone is significantly quieter
  // Threshold: 30 point difference in risk score
  const quieterZone = context.nearbyZones.find(
    (z) => z.score.riskScore < context.zoneScore.riskScore - 30,
  );

  if (quieterZone && now - context.lastNudgeSentAt > COOLDOWN_PERIODS_MS.ROUTE_SUGGESTION) {
    return {
      type: 'ROUTE_SUGGESTION',
      message: `${quieterZone.name} is much quieter right now. (~2 min walk)`,
      actionLabel: 'Take me there',
      actionRoute: `/navigate?to=${quieterZone.id}`,
      priority: 'MEDIUM',
      expiresAt: now + 180000,
    };
  }

  // Rule 3: VENDOR DEAL - Encourages flow toward low-density commercial zones
  const hasLowWaitVendor = context.nearbyZones.some((z) => z.score.congestionLevel === 'LOW');
  if (hasLowWaitVendor && now - context.lastNudgeSentAt > COOLDOWN_PERIODS_MS.VENDOR_DEAL) {
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
