export interface PredictionInput {
  currentDensity: number;
  inflowRate: number;
  outflowRate: number;
  timeHorizonMinutes: number;
  eventPhase: 'PRE_GAME' | 'IN_GAME' | 'HALFTIME' | 'POST_GAME';
}

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

// Rule-based fallback (used when Vertex AI endpoint is unavailable or skipping initial ML integration overhead)
export function predictDensityRuleBased(input: PredictionInput): number {
  const timeFactor = input.timeHorizonMinutes / 60;
  const netFlow = (input.inflowRate - input.outflowRate) * timeFactor;

  // Halftime surge multiplier
  const haltimeSurgeMultiplier = input.eventPhase === 'HALFTIME' ? 1.8 : 1.0;

  const futureDensity = Math.min(
    input.currentDensity + (netFlow / 100) * haltimeSurgeMultiplier,
    1.0, // Cap at 100% capacity
  );

  return Math.max(futureDensity, 0);
}

// Vertex AI-powered prediction (stubbed logic for endpoint routing)
export async function predictDensityWithVertexAI(
  features: PredictionFeatures,
): Promise<number | null> {
  const PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID;
  const ENDPOINT_ID = process.env.VERTEX_AI_ENDPOINT_ID;
  const REGION = 'us-central1';

  if (!PROJECT_ID || !ENDPOINT_ID) {
    console.warn('Vertex AI variables missing. Falling back to rule-based prediction.');
    return null;
  }

  const endpoint = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/endpoints/${ENDPOINT_ID}:predict`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        // Assume Google Cloud ADC or explicit token via environment
        Authorization: `Bearer ${process.env.GOOGLE_CLOUD_ACCESS_TOKEN || 'MISSING_TOKEN'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [features],
      }),
    });

    if (!response.ok) {
      throw new Error(`Vertex AI responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.predictions ? data.predictions[0] : null;
  } catch (error) {
    console.error('Failed to resolve Vertex AI prediction:', error);
    return null;
  }
}
