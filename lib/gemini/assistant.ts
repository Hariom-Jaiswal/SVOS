import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini client using the environment variable string
const apiKey = process.env.GEMINI_API_KEY || '';
export const genAI = new GoogleGenerativeAI(apiKey);

import { CrowdScore } from '../engines/crowdEngine';

export interface VenueContext {
  zones: Record<string, CrowdScore>;
  queues: Record<string, { waitMin: number; serviceRate: number }>;
  alerts: Record<string, { priority: string; message: string }>;
  userZone: string;
  eventPhase: string;
}

export async function askVenueAssistant(
  userQuery: string,
  venueContext: VenueContext,
): Promise<string> {
  if (!apiKey) {
    return 'Error: Gemini API key is missing. Ensure GEMINI_API_KEY is correctly set via environment variables.';
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
    console.error('Gemini error:', error);
    return 'I am currently unable to process your request. Please check your connection or wait a moment before trying again.';
  }
}
