import { LocationUpdate } from '../../types/sensor';
import { resolveZone } from './zoneResolver';
// import { db } from '../firebase/config'; // Real implementation

const LOCATION_UPDATE_INTERVAL_MS = 5000;

export function createLocationTracker(uid: string, venueId: string) {
  let lastUpdate = 0;
  let watchId: number;

  const startTracking = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        // Debounce: skip if too recent
        if (now - lastUpdate < LOCATION_UPDATE_INTERVAL_MS) return;
        // Skip low-accuracy reads (>50m indoors is unreliable)
        if (position.coords.accuracy > 50) return;

        lastUpdate = now;

        const zone = resolveZone(position.coords.latitude, position.coords.longitude, venueId);

        const update: LocationUpdate = {
          uid,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: now,
          zone,
        };

        // TODO: In production, write this location payload to Firebase Realtime Database
        // e.g: await set(ref(db, `venues/${venueId}/users/${uid}`), update);
        console.log('[Sense Layer] Location processed:', update);
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const stopTracking = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  };

  return { startTracking, stopTracking };
}
