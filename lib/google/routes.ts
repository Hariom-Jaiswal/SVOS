import { CloudServiceError } from '../security/errors';
import { API_CONFIG } from '../constants';

/**
 * Geographic coordinates
 */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * A named spatial zone with its current safety state
 */
export interface Zone {
  id: string;
  name: string;
  center: LatLng;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Payload for computing a pedestrian route
 */
export interface RouteRequest {
  origin: LatLng;
  destination: LatLng;
  /** List of current congestion zones to consider for avoidance */
  congestionZones: Zone[];
}

/**
 * Computes the safest pedestrian route between two points, avoiding HIGH/CRITICAL congestion areas.
 * Uses the Google Maps Routes API v2.
 *
 * @param request - Origin, destination, and zones to avoid
 * @returns A Promise resolving to the first route response or null on silenceable failure
 * @throws {CloudServiceError} if the API key is missing or the service responds with an error
 */
export async function getOptimalRoute({ origin, destination, congestionZones }: RouteRequest) {
  // Only high or critical congestion zones are avoided in routing
  const avoidPoints = congestionZones
    .filter((z) => z.congestionLevel === 'HIGH' || z.congestionLevel === 'CRITICAL')
    .map((z) => ({
      location: { latLng: z.center },
    }));

  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;
  if (!apiKey) {
    throw new CloudServiceError('API key is missing', 'Google Routes');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline',
      },
      body: JSON.stringify({
        origin: { location: { latLng: origin } },
        destination: { location: { latLng: destination } },
        intermediates: avoidPoints.length > 0 ? avoidPoints.slice(0, 5) : [],
        travelMode: 'WALK',
        routingPreference: 'ROUTING_PREFERENCE_UNSPECIFIED',
        languageCode: 'en-US',
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new CloudServiceError(
        `Service responded with status ${response.status}`,
        'Google Routes',
      );
    }

    const data = await response.json();
    return data.routes ? data.routes[0] : null;
  } catch (error) {
    if (error instanceof CloudServiceError) throw error;
    console.error('Error computing optimal route:', error);
    return null;
  }
}
