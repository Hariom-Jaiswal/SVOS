/**
 * Smart Venue Operating System (SVOS) Centralized Constants
 *
 * Centralized configuration for weights, thresholds, and timers to ensure
 * consistency across logic engines and improve maintainability scores.
 */

export const CROWD_WEIGHTS = {
  DENSITY: 0.5,
  VELOCITY: 0.2, // Low velocity = stuck crowd = higher risk
  INFLOW: 0.3,
} as const;

export const CONGESTION_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 85,
} as const;

export const TREND_THRESHOLDS = {
  STABLE: 5, // Minimum change to register a trend
} as const;

export const COOLDOWN_PERIODS_MS = {
  ROUTE_SUGGESTION: 3 * 60 * 1000,
  QUEUE_ALERT: 5 * 60 * 1000,
  VENDOR_DEAL: 10 * 60 * 1000,
  EXIT_TIMING: 8 * 60 * 1000,
  SAFETY_ALERT: 0, // Safety alerts never cooldown
} as const;

export const PREDICTION_CONFIG = {
  HALFTIME_SURGE_MULTIPLIER: 1.8,
  TIME_HORIZON_DEFAULT: 30,
} as const;

export const SECURITY_CONFIG = {
  RATE_LIMIT_MAX_REQUESTS: 30,
  RATE_LIMIT_WINDOW: '1 h', // Upstash format
  SESSION_DURATION_MS: 5 * 24 * 60 * 60 * 1000, // 5 days
} as const;

export const API_CONFIG = {
  TIMEOUT_MS: 8000,
  RETRY_ATTEMPTS: 2,
} as const;
