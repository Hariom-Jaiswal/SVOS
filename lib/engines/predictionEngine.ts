import { PREDICTION_CONFIG, API_CONFIG } from '../constants';
import { CloudServiceError, AppError } from '../security/errors';

/**
 * Input vector for density prediction algorithms
 */
export interface PredictionInput {
  currentDensity: number;
  inflowRate: number;
  outflowRate: number;
  /** Minutes into the future to predict */
  timeHorizonMinutes: number;
  eventPhase: 'PRE_GAME' | 'IN_GAME' | 'HALFTIME' | 'POST_GAME';
}

/**
 * Normalized features for ML model inference
 */
export interface PredictionFeatures {
  hour_of_day: number;
  day_of_week: number;
  zone_id_encoded: number;
  current_density: number;
  inflow_rate: number;
  outflow_rate: number;
  event_type_encoded: number;
  capacity_pct: number;
}

/**
 * Rule-based fallback prediction using flow vectors and event modifiers.
 *
 * DESIGN DECISION: HYBRID AI + FALLBACK MODEL
 * Large scale sports venues require deterministic reliability. We use
 * a "Hybrid" model where this rule-based engine acts as the ground-truth
 * safety layer, ensuring intelligence remains active even if external
 * ML endpoints (Vertex AI) experience latency or connectivity issues.
 *
 * @param input - The current venue state and prediction horizon
 * @returns Predicted density (0-1)
 */
export function predictDensityRuleBased(input: PredictionInput): number {
  const timeFactor = input.timeHorizonMinutes / 60;
  const netFlow = (input.inflowRate - input.outflowRate) * timeFactor;

  // Modifiers applied based on historical surge analytics
  const haltimeSurgeMultiplier =
    input.eventPhase === 'HALFTIME' ? PREDICTION_CONFIG.HALFTIME_SURGE_MULTIPLIER : 1.0;

  const futureDensity = Math.min(
    input.currentDensity + (netFlow / 100) * haltimeSurgeMultiplier,
    1.0, // Cap at 100% capacity
  );

  return Math.max(futureDensity, 0);
}

/**
 * Fetches a prediction from a Vertex AI AutoML or Custom model endpoint.
 * Requires a valid Google Cloud Access Token in the environment.
 *
 * @param features - The normalized feature vector for inference
 * @returns A Promise resolving to the predicted density or null on failure
 * @throws {CloudServiceError} if the project config is missing or the API responds with an error
 */
export async function predictDensityWithVertexAI(
  features: PredictionFeatures,
): Promise<number | null> {
  const PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID;
  const ENDPOINT_ID = process.env.VERTEX_AI_ENDPOINT_ID;
  const REGION = 'us-central1';

  if (!PROJECT_ID || !ENDPOINT_ID) {
    throw new CloudServiceError(
      'Vertex AI project or endpoint ID is missing in environment.',
      'Vertex AI',
    );
  }

  const endpoint = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/endpoints/${ENDPOINT_ID}:predict`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.GOOGLE_CLOUD_ACCESS_TOKEN || 'MISSING_TOKEN'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [features],
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new CloudServiceError(
        `Vertex AI responded with status ${response.status}`,
        'Vertex AI',
      );
    }

    const data = await response.json();
    return data.predictions ? data.predictions[0] : null;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Failed to resolve Vertex AI prediction:', error);
    return null;
  }
}
