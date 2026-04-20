# SVOS — Smart Venue Operating System
### Complete Engineering Workflow & System Design Document
**Version:** 2.0.0 | **Competition:** Google Solution Challenge | **Vertical:** Smart Venues / Event Tech

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Google Services Integration](#3-google-services-integration)
4. [Authentication & Authorization Workflow](#4-authentication--authorization-workflow)
5. [Data Collection Layer (Sense)](#5-data-collection-layer-sense)
6. [Crowd Intelligence Engine](#6-crowd-intelligence-engine)
7. [Prediction Engine](#7-prediction-engine)
8. [Decision Engine](#8-decision-engine)
9. [Smart Nudging Engine](#9-smart-nudging-engine)
10. [User Interaction Layer](#10-user-interaction-layer)
11. [AI Assistant Layer (Gemini)](#11-ai-assistant-layer-gemini)
12. [Operations Command Center](#12-operations-command-center)
13. [Learning & Feedback Loop](#13-learning--feedback-loop)
14. [Security Workflow](#14-security-workflow)
15. [Testing Strategy](#15-testing-strategy)
16. [Accessibility Workflow](#16-accessibility-workflow)
17. [Efficiency & Performance Strategy](#17-efficiency--performance-strategy)
18. [Project Structure](#18-project-structure)
19. [Environment & Configuration](#19-environment--configuration)
20. [README Summary](#20-readme-summary)

---

## 1. System Overview

SVOS (Smart Venue Operating System) is an intelligent, real-time platform that optimizes the physical experience of attendees at large-scale sporting venues. It solves three core pain points:

| Pain Point | SVOS Solution |
|---|---|
| Crowd bottlenecks | Predictive crowd routing via Google Maps Routes API |
| Long vendor queues | Virtual queue system with Firebase Realtime DB |
| Poor navigation | Indoor wayfinding + AI assistant powered by Gemini |
| Operator blind spots | Live command center with Google Maps heatmaps |
| Poor post-event learning | ML feedback loop via Vertex AI |

### Closed-Loop Intelligence Model

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   SENSE → PREDICT → DECIDE → ACT → LEARN → (repeat)        │
│                                                             │
│   Inputs         Crowd Engine      Nudge Engine             │
│   Firebase RT DB  Prediction Eng.  Gemini AI                │
│   Google Maps     Decision Eng.    Maps Navigation          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR, performance, type safety |
| Styling | Tailwind CSS + shadcn/ui | Rapid, accessible UI |
| Backend | Next.js API Routes + tRPC | Type-safe end-to-end APIs |
| Realtime DB | Firebase Realtime Database | Sub-100ms latency |
| Auth | Firebase Auth + Google Sign-In | OAuth 2.0, seamless Google integration |
| Maps | Google Maps JS API + Routes API | Indoor maps, wayfinding |
| AI | Gemini 1.5 Pro API (Google AI Studio) | Natural language assistant |
| ML/Predictions | Vertex AI (Google Cloud) | Crowd forecasting model |
| Hosting | Firebase Hosting + Cloud Run | Scalable, serverless |
| Monitoring | Google Cloud Monitoring + Logging | Observability |
| Testing | Jest + Playwright + React Testing Library | Unit, integration, E2E |

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│   Next.js App (PWA)   │   Operator Dashboard   │   Mobile Web App   │
└──────────────┬────────────────────┬────────────────────┬────────────┘
               │  HTTPS + WebSocket │                    │
┌──────────────▼────────────────────▼────────────────────▼────────────┐
│                        API GATEWAY LAYER                             │
│   Next.js API Routes (tRPC)  │  Firebase Auth Middleware             │
│   Rate Limiting (Upstash)    │  Input Validation (Zod)               │
└──────────────┬───────────────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────────────┐
│                        CORE ENGINE LAYER                             │
│                                                                      │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Crowd Engine   │  │ Prediction Engine │  │ Decision Engine  │   │
│  │  density/flow   │  │  Vertex AI model  │  │  route/queue opt │   │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘   │
│           └────────────────────┴────────────────────┘              │
└──────────────────────────────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────────────┐
│                        SERVICES LAYER                                │
│                                                                      │
│  Firebase Realtime DB   │  Google Maps API   │  Gemini API          │
│  Vertex AI              │  Google Cloud Run  │  Cloud Monitoring    │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow Sequence

```
User Opens App
     │
     ▼
Firebase Auth (Google Sign-In)
     │
     ▼
Location Permission Request (Geolocation API)
     │
     ▼
GPS → Firebase RT DB → Crowd Engine (server-side)
                              │
                              ▼
                    Prediction Engine (Vertex AI)
                              │
                              ▼
                    Decision Engine → Optimal Route/Queue
                              │
                              ▼
                    Nudge Engine → Push Notification / In-App
                              │
                              ▼
                    User Action → Behavior Logged
                              │
                              ▼
                    Feedback Loop → Model Retraining
```

---

## 3. Google Services Integration

This section documents every Google service used, why it is used, and how it integrates.

### 3.1 Firebase Authentication

**Purpose:** Secure user login with Google OAuth. Zero password management.

```typescript
// lib/firebase/auth.ts
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { app } from './config';

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Add venue-specific scopes
provider.addScope('profile');
provider.addScope('email');

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  return { user: result.user, credential };
}

export async function signOutUser() {
  await signOut(auth);
}
```

**User Roles & Claims:**

```typescript
// Roles stored in Firebase custom claims
type UserRole = 'attendee' | 'vendor' | 'operator' | 'admin';

// Set via Firebase Admin SDK (server-side only)
await adminAuth.setCustomUserClaims(uid, { role: 'operator' });
```

### 3.2 Firebase Realtime Database

**Purpose:** Sub-100ms crowd state sync across all clients.

**Database Schema:**

```json
{
  "venues": {
    "venue_001": {
      "zones": {
        "zone_A": {
          "density": 0.72,
          "inflow": 45,
          "outflow": 30,
          "timestamp": 1718000000000
        }
      },
      "queues": {
        "vendor_12": {
          "peopleAhead": 8,
          "estimatedWait": 240,
          "serviceRate": 2.1
        }
      },
      "alerts": {
        "alert_001": {
          "type": "HIGH_CONGESTION",
          "zone": "zone_A",
          "severity": 85,
          "timestamp": 1718000000000
        }
      }
    }
  },
  "users": {
    "{uid}": {
      "location": { "lat": 19.076, "lng": 72.877 },
      "zone": "zone_A",
      "preferences": { "accessibility": false, "language": "en" },
      "nudgeLastSent": 1718000000000
    }
  }
}
```

**Security Rules:**

```json
{
  "rules": {
    "venues": {
      "$venueId": {
        ".read": "auth != null",
        "zones": { ".write": "auth.token.role === 'operator'" },
        "queues": { ".write": "auth.token.role === 'vendor' || auth.token.role === 'operator'" },
        "alerts": { ".write": "auth.token.role === 'operator'" }
      }
    },
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || auth.token.role === 'operator'",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### 3.3 Google Maps JavaScript API

**Purpose:** Venue map rendering, indoor floor plans, crowd heatmaps, route drawing.

```typescript
// components/VenueMap.tsx
import { GoogleMap, HeatmapLayer, DirectionsRenderer } from '@react-google-maps/api';

interface VenueMapProps {
  crowdData: ZoneDensity[];
  suggestedRoute: google.maps.DirectionsResult | null;
  center: google.maps.LatLngLiteral;
}

export function VenueMap({ crowdData, suggestedRoute, center }: VenueMapProps) {
  const heatmapData = crowdData.map(zone => ({
    location: new google.maps.LatLng(zone.lat, zone.lng),
    weight: zone.density
  }));

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '500px' }}
      center={center}
      zoom={18}
      options={{
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
        indoorLevelControl: true,   // Indoor floor switching
        tilt: 0,
      }}
    >
      <HeatmapLayer data={heatmapData} options={{ radius: 30, opacity: 0.7 }} />
      {suggestedRoute && <DirectionsRenderer directions={suggestedRoute} />}
    </GoogleMap>
  );
}
```

### 3.4 Google Routes API

**Purpose:** Compute optimal pedestrian paths avoiding congested zones, factoring real-time crowd weight.

```typescript
// lib/google/routes.ts
interface RouteRequest {
  origin: LatLng;
  destination: LatLng;
  congestionZones: Zone[];
}

export async function getOptimalRoute({ origin, destination, congestionZones }: RouteRequest) {
  // Build waypoints that avoid high-congestion zones
  const avoidPoints = congestionZones
    .filter(z => z.congestionLevel === 'HIGH')
    .map(z => z.center);

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_ROUTES_API_KEY!,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline'
    },
    body: JSON.stringify({
      origin: { location: { latLng: origin } },
      destination: { location: { latLng: destination } },
      travelMode: 'WALK',
      routingPreference: 'ROUTING_PREFERENCE_UNSPECIFIED',
      languageCode: 'en-US'
    })
  });

  const data = await response.json();
  return data.routes[0];
}
```

### 3.5 Gemini 1.5 Pro API

**Purpose:** Natural language AI assistant for venue queries. Understands real-time context.

```typescript
// lib/gemini/assistant.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function askVenueAssistant(
  userQuery: string,
  venueContext: VenueContext
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const systemPrompt = `
    You are SVOS Assistant, an AI helping attendees at a large sports venue.
    Current venue state:
    - Crowd density by zone: ${JSON.stringify(venueContext.zones)}
    - Queue wait times: ${JSON.stringify(venueContext.queues)}
    - Active alerts: ${JSON.stringify(venueContext.alerts)}
    - User location: Zone ${venueContext.userZone}
    - Current time: ${new Date().toISOString()}

    Always give short, actionable advice. Prioritize safety.
    If crowd risk > 80, always mention the safest exit.
  `;

  const result = await model.generateContent([systemPrompt, userQuery]);
  return result.response.text();
}
```

**Example Queries Handled:**

```
User: "Where's the nearest washroom with short wait?"
→ Gemini reads zone data → "Washroom near Gate 5 has 0 queue. 2 min walk from your location."

User: "Best time to grab food?"
→ Reads halftime prediction → "In ~8 mins (halftime), all vendors will surge. Go now or wait 25 mins post-rush."

User: "Is it safe to exit now?"
→ Reads exit crowd score → "Gate 3 is HIGH congestion. Use Gate 7 — exits are clear, estimated 4 min to parking."
```

### 3.6 Vertex AI (Google Cloud)

**Purpose:** Train and serve the crowd prediction model.

```python
# ml/train_prediction_model.py
from google.cloud import aiplatform
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

def train_crowd_prediction_model():
    """
    Features: hour_of_day, day_of_week, zone_id, current_density,
              inflow_rate, outflow_rate, event_type, capacity_pct
    Target: density_in_15_minutes
    """
    aiplatform.init(project='svos-project', location='us-central1')

    df = pd.read_csv('gs://svos-data/crowd_history.csv')

    features = ['hour', 'day_of_week', 'zone_encoded', 'current_density',
                'inflow', 'outflow', 'event_type_encoded', 'capacity_pct']
    X = df[features]
    y = df['density_15min']

    model = Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', GradientBoostingRegressor(n_estimators=200, max_depth=5))
    ])
    model.fit(X, y)

    # Deploy to Vertex AI endpoint
    aiplatform.Model.upload(
        display_name='svos-crowd-predictor',
        artifact_uri='gs://svos-models/',
        serving_container_image_uri='us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-3:latest'
    )
```

### 3.7 Firebase Cloud Messaging (FCM)

**Purpose:** Push smart nudges to user devices even when app is backgrounded.

```typescript
// lib/firebase/messaging.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export async function initPushNotifications(uid: string) {
  const messaging = getMessaging();
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY
  });

  // Register token in Firestore against user
  await updateUserFCMToken(uid, token);

  // Handle foreground messages
  onMessage(messaging, (payload) => {
    showInAppNudge(payload.notification?.title ?? '', payload.notification?.body ?? '');
  });
}
```

### 3.8 Google Cloud Monitoring

**Purpose:** Observe system health, latency, and error rates in production.

```typescript
// Instrument key operations
import { Logging } from '@google-cloud/logging';
const logging = new Logging({ projectId: 'svos-project' });

export async function logCrowdEvent(event: CrowdEvent) {
  const log = logging.log('crowd-events');
  const entry = log.entry({ resource: { type: 'global' } }, event);
  await log.write(entry);
}
```

---

## 4. Authentication & Authorization Workflow

### 4.1 Auth Flow Diagram

```
User Opens App
      │
      ▼
Firebase Auth Check → Token exists & valid?
      │                        │
     YES                       NO
      │                        │
      ▼                        ▼
Load User Profile      Google Sign-In Popup
      │                        │
      ▼                        ▼
Decode JWT Claims      Firebase creates session
(role, venueId, uid)           │
      │                        ▼
      ▼                 Set custom claims (role)
Route to correct               │
role-based view                ▼
                        Redirect to app
```

### 4.2 Middleware Protection

```typescript
// middleware.ts (Next.js App Router)
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from './lib/firebase/admin';

const PROTECTED_ROUTES = ['/dashboard', '/operator', '/vendor'];
const OPERATOR_ONLY = ['/operator'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;

  if (PROTECTED_ROUTES.some(r => request.nextUrl.pathname.startsWith(r))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (OPERATOR_ONLY.some(r => request.nextUrl.pathname.startsWith(r))) {
      if (decodedToken.role !== 'operator' && decodedToken.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/operator/:path*', '/vendor/:path*']
};
```

### 4.3 Session Management

```typescript
// app/api/auth/session/route.ts
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { idToken } = await req.json();

  // Verify the ID token
  const decodedToken = await adminAuth.verifyIdToken(idToken);

  // Create a session cookie (5 days)
  const expiresIn = 5 * 24 * 60 * 60 * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

  cookies().set('session', sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: expiresIn / 1000,
    path: '/'
  });

  return Response.json({ status: 'success', uid: decodedToken.uid });
}

export async function DELETE() {
  cookies().delete('session');
  return Response.json({ status: 'signed-out' });
}
```

### 4.4 Role-Based Access Control (RBAC)

| Feature | Attendee | Vendor | Operator | Admin |
|---|---|---|---|---|
| View crowd map | ✅ | ✅ | ✅ | ✅ |
| Get route suggestions | ✅ | ✅ | ✅ | ✅ |
| Join virtual queue | ✅ | ❌ | ✅ | ✅ |
| Update queue service rate | ❌ | ✅ | ✅ | ✅ |
| View operator dashboard | ❌ | ❌ | ✅ | ✅ |
| Override crowd alerts | ❌ | ❌ | ✅ | ✅ |
| Manage users/venues | ❌ | ❌ | ❌ | ✅ |
| Retrain ML model | ❌ | ❌ | ❌ | ✅ |

---

## 5. Data Collection Layer (Sense)

### 5.1 Inputs

```typescript
// types/sensor.ts
export interface LocationUpdate {
  uid: string;
  lat: number;
  lng: number;
  accuracy: number;   // GPS accuracy in meters
  timestamp: number;
  zone: string;       // Resolved zone from coordinates
}

export interface QueueUpdate {
  vendorId: string;
  peopleAhead: number;
  serviceRate: number;   // customers per minute
  timestamp: number;
}

export interface SensorReading {
  zoneId: string;
  deviceCount: number;     // WiFi/BT probe count (simulated)
  cameraCount?: number;    // Optional: camera-based count
  timestamp: number;
}
```

### 5.2 Location Processing Pipeline

```typescript
// lib/sensors/locationProcessor.ts

// Debounced to avoid flooding Firebase (max 1 update per 5 seconds per user)
const LOCATION_UPDATE_INTERVAL_MS = 5000;

export function createLocationTracker(uid: string, venueId: string) {
  let lastUpdate = 0;
  let watchId: number;

  const startTracking = () => {
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
          zone
        };

        await writeLocationToFirebase(update, venueId);
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopTracking = () => navigator.geolocation.clearWatch(watchId);
  return { startTracking, stopTracking };
}
```

### 5.3 Zone Resolution

```typescript
// lib/sensors/zoneResolver.ts
// Uses Google Maps Geometry library for polygon containment check

import { containsLocation, LatLng, Polygon } from '@googlemaps/geometry';

export function resolveZone(lat: number, lng: number, venueId: string): string {
  const zones = getVenueZones(venueId);   // Cached zone polygon definitions

  for (const zone of zones) {
    const polygon = new google.maps.Polygon({ paths: zone.bounds });
    if (containsLocation(new google.maps.LatLng(lat, lng), polygon)) {
      return zone.id;
    }
  }

  return 'unknown';
}
```

---

## 6. Crowd Intelligence Engine

### 6.1 Core Scoring Logic

```typescript
// lib/engines/crowdEngine.ts

export interface ZoneMetrics {
  zoneId: string;
  density: number;        // 0–1 (fraction of capacity)
  velocity: number;       // movement speed (m/s avg)
  inflowRate: number;     // people entering per minute
  outflowRate: number;    // people leaving per minute
  timestamp: number;
}

export interface CrowdScore {
  rawScore: number;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;    // 0–100
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
}

// Weights tuned from historical event data
const WEIGHTS = {
  density: 0.5,
  velocity: 0.2,    // Low velocity = stuck crowd = higher risk
  inflow: 0.3
};

export function calculateCrowdScore(metrics: ZoneMetrics): CrowdScore {
  // Velocity is inverted: slow movement = higher risk
  const normalizedVelocity = 1 - Math.min(metrics.velocity / 2.0, 1);

  const rawScore = (
    WEIGHTS.density * metrics.density +
    WEIGHTS.velocity * normalizedVelocity +
    WEIGHTS.inflow * Math.min(metrics.inflowRate / 100, 1)
  );

  const riskScore = Math.round(rawScore * 100);

  const congestionLevel =
    riskScore < 30 ? 'LOW' :
    riskScore < 60 ? 'MEDIUM' :
    riskScore < 85 ? 'HIGH' : 'CRITICAL';

  return { rawScore, congestionLevel, riskScore, trend: 'STABLE' };
}

export function attachTrend(current: CrowdScore, previous: CrowdScore | null): CrowdScore {
  if (!previous) return { ...current, trend: 'STABLE' };
  const delta = current.riskScore - previous.riskScore;
  const trend = delta > 5 ? 'WORSENING' : delta < -5 ? 'IMPROVING' : 'STABLE';
  return { ...current, trend };
}
```

### 6.2 Zone Aggregation

```typescript
// Runs server-side every 10 seconds via Cloud Run job
export async function aggregateVenueCrowdState(venueId: string): Promise<VenueCrowdState> {
  const userLocations = await getUserLocationsInVenue(venueId);

  // Count users per zone
  const zoneCounts: Record<string, number> = {};
  for (const loc of userLocations) {
    zoneCounts[loc.zone] = (zoneCounts[loc.zone] ?? 0) + 1;
  }

  // Score each zone
  const zoneScores: Record<string, CrowdScore> = {};
  for (const [zoneId, count] of Object.entries(zoneCounts)) {
    const capacity = getZoneCapacity(venueId, zoneId);
    const density = count / capacity;
    // ... fetch velocity, inflow from sensors
    zoneScores[zoneId] = calculateCrowdScore({ zoneId, density, velocity: 1.2, inflowRate: 30, outflowRate: 25, timestamp: Date.now() });
  }

  return { venueId, zones: zoneScores, updatedAt: Date.now() };
}
```

---

## 7. Prediction Engine

### 7.1 Short-Term Density Forecast

```typescript
// lib/engines/predictionEngine.ts

interface PredictionInput {
  currentDensity: number;
  inflowRate: number;
  outflowRate: number;
  timeHorizonMinutes: number;
  eventPhase: 'PRE_GAME' | 'IN_GAME' | 'HALFTIME' | 'POST_GAME';
}

// Rule-based fallback (used when Vertex AI endpoint is unavailable)
export function predictDensityRuleBased(input: PredictionInput): number {
  const timeFactor = input.timeHorizonMinutes / 60;
  const netFlow = (input.inflowRate - input.outflowRate) * timeFactor;

  // Halftime surge multiplier
  const haltimeSurgeMultiplier = input.eventPhase === 'HALFTIME' ? 1.8 : 1.0;

  const futureDensity = Math.min(
    input.currentDensity + (netFlow / 100) * haltimeSurgeMultiplier,
    1.0  // Cap at 100% capacity
  );

  return Math.max(futureDensity, 0);
}

// Vertex AI-powered prediction (production)
export async function predictDensityWithVertexAI(
  features: PredictionFeatures
): Promise<number> {
  const endpoint = `https://${VERTEX_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/us-central1/endpoints/${ENDPOINT_ID}:predict`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getGoogleAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      instances: [features]
    })
  });

  const result = await response.json();
  return result.predictions[0];
}
```

### 7.2 Event Phase Detection

```typescript
// Automatically detects event phase from schedule + crowd patterns
export function detectEventPhase(
  eventStartTime: number,
  currentTime: number,
  gameDurationMinutes: number
): EventPhase {
  const minutesSinceStart = (currentTime - eventStartTime) / 60000;

  if (minutesSinceStart < -30) return 'PRE_GAME';
  if (minutesSinceStart < 0) return 'ENTRY_RUSH';
  if (minutesSinceStart < gameDurationMinutes / 2 - 5) return 'IN_GAME_FIRST_HALF';
  if (minutesSinceStart < gameDurationMinutes / 2 + 20) return 'HALFTIME';
  if (minutesSinceStart < gameDurationMinutes + 15) return 'IN_GAME_SECOND_HALF';
  return 'POST_GAME_EXIT';
}
```

---

## 8. Decision Engine

### 8.1 Route Optimization

```typescript
// lib/engines/decisionEngine.ts

interface RouteCandidate {
  routeId: string;
  distanceMeters: number;
  estimatedSeconds: number;
  congestionScore: number;   // 0–1
  waitTimeSeconds: number;
}

// Weights configurable per venue
const ROUTE_WEIGHTS = {
  distance: 0.2,
  time: 0.4,
  congestion: 0.3,
  wait: 0.1
};

export function selectOptimalRoute(candidates: RouteCandidate[]): RouteCandidate {
  const scored = candidates.map(route => {
    // Normalize each dimension to 0–1
    const maxDistance = Math.max(...candidates.map(r => r.distanceMeters));
    const maxTime = Math.max(...candidates.map(r => r.estimatedSeconds));
    const maxWait = Math.max(...candidates.map(r => r.waitTimeSeconds));

    const score =
      ROUTE_WEIGHTS.distance * (route.distanceMeters / maxDistance) +
      ROUTE_WEIGHTS.time * (route.estimatedSeconds / maxTime) +
      ROUTE_WEIGHTS.congestion * route.congestionScore +
      ROUTE_WEIGHTS.wait * (route.waitTimeSeconds / (maxWait || 1));

    return { ...route, score };
  });

  // Return minimum score route
  return scored.reduce((best, curr) => curr.score < best.score ? curr : best);
}
```

### 8.2 Virtual Queue System

```typescript
// lib/engines/queueEngine.ts

interface QueueState {
  vendorId: string;
  slots: QueueSlot[];
  serviceRatePerMinute: number;
}

interface QueueSlot {
  slotId: string;
  uid: string;
  position: number;
  estimatedReadyTime: number;
  status: 'WAITING' | 'READY' | 'SERVED' | 'CANCELLED';
}

export function calculateQueueWaitTime(state: QueueState, newPosition: number): number {
  // queueTime = peopleAhead / serviceRate (in seconds)
  return Math.ceil((newPosition / state.serviceRatePerMinute) * 60);
}

export async function joinVirtualQueue(
  uid: string,
  vendorId: string,
  venueId: string
): Promise<QueueSlot> {
  const queueRef = db.ref(`venues/${venueId}/queues/${vendorId}`);

  const slot = await queueRef.transaction((currentState: QueueState | null) => {
    if (!currentState) return null;  // Abort if no queue exists

    const position = currentState.slots.filter(s => s.status === 'WAITING').length + 1;
    const waitSeconds = calculateQueueWaitTime(currentState, position);

    const newSlot: QueueSlot = {
      slotId: `slot_${Date.now()}`,
      uid,
      position,
      estimatedReadyTime: Date.now() + waitSeconds * 1000,
      status: 'WAITING'
    };

    currentState.slots.push(newSlot);
    return currentState;
  });

  return slot;
}
```

### 8.3 Experience Score Minimization

```typescript
// The core objective function
export function calculateExperienceScore(params: {
  waitTimeSeconds: number;
  walkingTimeSeconds: number;
  congestionExposure: number;   // avg congestion score along path (0–1)
  accessibilityNeeds: boolean;
}): number {
  const base =
    params.waitTimeSeconds +
    params.walkingTimeSeconds * 1.5 +         // Walking weighted more (physical effort)
    params.congestionExposure * 300;           // High congestion = big penalty

  // Accessibility users: penalize routes with stairs or long distances
  const accessibilityPenalty = params.accessibilityNeeds
    ? params.walkingTimeSeconds * 0.5
    : 0;

  return base + accessibilityPenalty;
}
```

---

*— End of Part 1 — Continues in WORKFLOW_PART2.md —*
