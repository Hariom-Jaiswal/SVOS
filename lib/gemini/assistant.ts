import { GoogleGenerativeAI } from '@google/generative-ai';
import { CrowdScore } from '../engines/crowdEngine';
import { AIError } from '../security/errors';

// Initialize the Gemini client using the environment variable string
const apiKey = process.env.GEMINI_API_KEY || '';
export const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Real-time context used by the AI to provide situational awareness
 */
export interface VenueContext {
  /** Map of zone IDs to their computed crowd scores */
  zones: Record<string, CrowdScore>;
  /** Map of vendor/service IDs to queue performance metrics */
  queues: Record<string, { waitMin: number; serviceRate: number }>;
  /** Active safety or operational alerts */
  alerts: Record<string, { priority: string; message: string }>;
  /** The specific zone ID where the user is currently located */
  userZone: string;
  /** Progression of the event (e.g., Pre-game, Halftime) */
  eventPhase: string;
}

/**
 * Queries the Gemini AI assistant with live venue context.
 *
 * @param userQuery - The natural language question from the attendee
 * @param venueContext - Filtered contextual data for the model to ground its response
 * @returns A Promise resolving to the AI's response text
 * @throws {AIError} if the API key is missing or model generation fails
 */
export async function askVenueAssistant(
  userQuery: string,
  venueContext: VenueContext,
): Promise<string> {
  if (!apiKey) {
    throw new AIError('Gemini API key is missing. Check environment variables.', 'CRITICAL');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const systemPrompt = `
      You are SVOS Assistant, an AI helping attendees at a large sports venue.
      Current venue state:
      - Crowd density by zone: ${JSON.stringify(venueContext.zones)}
      - Queue wait times: ${JSON.stringify(venueContext.queues)}
      - Active alerts: ${JSON.stringify(venueContext.alerts)}
      - User location: Zone ${venueContext.userZone}
      - Event phase: ${venueContext.eventPhase}
      - Current time: ${new Date().toISOString()}

      Always give short, actionable advice. Prioritize safety. 
      If crowd risk is critical anywhere nearby, immediately direct the user to the safest exit or low-congestion area.
    `;

    const result = await model.generateContent([systemPrompt, userQuery]);
    return result.response.text();
  } catch (error) {
    if (error instanceof AIError) throw error;
    console.error('Gemini error:', error);
    throw new AIError('Failed to generate AI response. Service may be overloaded.');
  }
}
