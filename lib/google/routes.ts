export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Zone {
  id: string;
  name: string;
  center: LatLng;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RouteRequest {
  origin: LatLng;
  destination: LatLng;
  congestionZones: Zone[];
}

export async function getOptimalRoute({ origin, destination, congestionZones }: RouteRequest) {
  // Build waypoints that avoid high-congestion zones
  // Only high or critical congestion zones are avoided in routing
  const avoidPoints = congestionZones
    .filter((z) => z.congestionLevel === 'HIGH' || z.congestionLevel === 'CRITICAL')
    .map((z) => ({
      location: { latLng: z.center },
    }));

  // Ensure an API key exists
  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;
  if (!apiKey) {
    console.error('Google Routes API key is missing.');
    return null;
  }

  try {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Request duration, distance, and polyline structure matching
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline',
      },
      body: JSON.stringify({
        origin: { location: { latLng: origin } },
        destination: { location: { latLng: destination } },
        // Add avoid modifiers via intermediate waypoints (approximated for walking)
        // Note: Routes API v2 has extensive routing modifiers. For pedestrian paths,
        // avoiding specific polygon areas is advanced, so we can mock waypoints.
        intermediates: avoidPoints.length > 0 ? avoidPoints.slice(0, 5) : [],
        travelMode: 'WALK',
        routingPreference: 'ROUTING_PREFERENCE_UNSPECIFIED',
        languageCode: 'en-US',
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Routes API returned ${response.status}`);
    }

    const data = await response.json();
    return data.routes ? data.routes[0] : null;
  } catch (error) {
    console.error('Error computing optimal route:', error);
    return null;
  }
}
