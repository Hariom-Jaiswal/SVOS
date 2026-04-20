# SVOS — Smart Venue Operating System
### Workflow Document — Part 2 of 2

---

## 9. Smart Nudging Engine

### 9.1 Nudge Logic

```typescript
// lib/engines/nudgeEngine.ts

type NudgeType = 'ROUTE_SUGGESTION' | 'QUEUE_ALERT' | 'VENDOR_DEAL' | 'EXIT_TIMING' | 'SAFETY_ALERT';

interface Nudge {
  type: NudgeType;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expiresAt: number;
}

interface NudgeContext {
  uid: string;
  currentZone: string;
  zoneScore: CrowdScore;
  nearbyZones: ZoneWithScore[];
  lastNudgeSentAt: number;
  preferences: UserPreferences;
}

// Cooldown periods per nudge type (prevents notification spam)
const COOLDOWN_MS: Record<NudgeType, number> = {
  ROUTE_SUGGESTION: 3 * 60 * 1000,   // 3 minutes
  QUEUE_ALERT: 5 * 60 * 1000,        // 5 minutes
  VENDOR_DEAL: 10 * 60 * 1000,       // 10 minutes
  EXIT_TIMING: 8 * 60 * 1000,        // 8 minutes
  SAFETY_ALERT: 0                     // No cooldown — always send safety
};

export function evaluateNudges(context: NudgeContext): Nudge | null {
  const now = Date.now();

  // 1. SAFETY — highest priority, always fires
  if (context.zoneScore.congestionLevel === 'CRITICAL') {
    return {
      type: 'SAFETY_ALERT',
      message: `⚠️ Your area is overcrowded. Move to ${getSafeZone(context.nearbyZones)} now.`,
      actionLabel: 'Show safe route',
      actionRoute: `/navigate?to=${getSafeZone(context.nearbyZones)}`,
      priority: 'URGENT',
      expiresAt: now + 120000
    };
  }

  // 2. ROUTE SUGGESTION — when nearby zone is much less crowded
  const quieterZone = context.nearbyZones.find(
    z => z.score.riskScore < context.zoneScore.riskScore - 30
  );

  if (quieterZone && now - context.lastNudgeSentAt > COOLDOWN_MS.ROUTE_SUGGESTION) {
    return {
      type: 'ROUTE_SUGGESTION',
      message: `${quieterZone.name} is much quieter right now. ~2 min walk.`,
      actionLabel: 'Take me there',
      actionRoute: `/navigate?to=${quieterZone.id}`,
      priority: 'MEDIUM',
      expiresAt: now + 180000
    };
  }

  // 3. VENDOR DEAL — low-wait vendor with active promotion
  const dealVendor = getVendorWithDealAndLowWait(context.currentZone);
  if (dealVendor && now - context.lastNudgeSentAt > COOLDOWN_MS.VENDOR_DEAL) {
    return {
      type: 'VENDOR_DEAL',
      message: `${dealVendor.name} near you: 10% off + only ${dealVendor.waitMin} min wait!`,
      actionLabel: 'Join queue',
      actionRoute: `/queue/${dealVendor.id}`,
      priority: 'LOW',
      expiresAt: now + 600000
    };
  }

  return null;
}
```

### 9.2 Nudge Delivery Pipeline

```typescript
// Runs server-side for all active users
export async function runNudgePipeline(venueId: string) {
  const activeUsers = await getActiveUsersInVenue(venueId);
  const venueState = await getVenueCrowdState(venueId);

  for (const user of activeUsers) {
    const context: NudgeContext = {
      uid: user.uid,
      currentZone: user.zone,
      zoneScore: venueState.zones[user.zone],
      nearbyZones: getNearbyZones(user.zone, venueState),
      lastNudgeSentAt: user.nudgeLastSent ?? 0,
      preferences: user.preferences
    };

    const nudge = evaluateNudges(context);

    if (nudge) {
      await deliverNudge(user.uid, nudge, user.fcmToken);
      await updateUserNudgeTimestamp(user.uid, venueId);
    }
  }
}

async function deliverNudge(uid: string, nudge: Nudge, fcmToken: string | null) {
  if (fcmToken) {
    // Background push via FCM
    await sendFCMNotification(fcmToken, nudge);
  }

  // Always write to Firebase for in-app display
  await db.ref(`users/${uid}/pendingNudge`).set(nudge);
}
```

---

## 10. User Interaction Layer

### 10.1 User Journey Map

```
ARRIVAL
  │
  ▼
App opens → Google Sign-In
  │
  ▼
Grant Location Permission
  │
  ▼
Venue auto-detected (GPS → venue polygon match)
  │
  ▼
Onboarding prompt: Accessibility needs? Language?
  │
  ╔═══════════════════════════════════════╗
  ║  MAIN DASHBOARD                       ║
  ║  ┌──────────┐  ┌──────────────────┐  ║
  ║  │ Crowd Map│  │ AI Assistant     │  ║
  ║  │ (heatmap)│  │ "Ask anything"   │  ║
  ║  └──────────┘  └──────────────────┘  ║
  ║  ┌──────────┐  ┌──────────────────┐  ║
  ║  │ Navigate │  │ My Queue         │  ║
  ║  │ to seat  │  │ Status           │  ║
  ║  └──────────┘  └──────────────────┘  ║
  ╚═══════════════════════════════════════╝
  │
  ▼
SMART NUDGE appears (if triggered)
"Gate 3 crowded → Use Gate 5 (2 min faster)"
  │
  ├── User taps "Take me there" → Maps navigation starts
  └── User dismisses → Logged as negative feedback

HALFTIME
  │
  ▼
Push notification: "Low-wait food vendor 90m away + 10% off"
  │
  ▼
User joins virtual queue → Gets slot confirmation
  │
  ▼
"Your order ready in 4 mins" notification

EXIT
  │
  ▼
"Wait 8 mins or use Gate 7 (clear now)"
  │
  ▼
Navigation to optimal exit
```

### 10.2 Key UI Components

```typescript
// components/NudgeBanner.tsx
interface NudgeBannerProps {
  nudge: Nudge;
  onAccept: () => void;
  onDismiss: () => void;
}

export function NudgeBanner({ nudge, onAccept, onDismiss }: NudgeBannerProps) {
  const colorMap = {
    URGENT: 'bg-red-600 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-blue-500 text-white',
    LOW: 'bg-green-500 text-white'
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`fixed bottom-4 left-4 right-4 rounded-xl p-4 shadow-lg z-50 ${colorMap[nudge.priority]}`}
    >
      <p className="font-semibold text-sm">{nudge.message}</p>
      <div className="flex gap-2 mt-2">
        {nudge.actionLabel && (
          <button
            onClick={onAccept}
            className="bg-white text-black text-xs px-3 py-1 rounded-full font-bold"
          >
            {nudge.actionLabel}
          </button>
        )}
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="text-xs underline opacity-80"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
```

### 10.3 Voice Query Support

```typescript
// lib/voice/voiceAssistant.ts
// Uses Web Speech API + Gemini for spoken queries

export class VoiceAssistant {
  private recognition: SpeechRecognition;

  constructor(private onQuery: (text: string) => Promise<string>) {
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;

    this.recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      const response = await this.onQuery(transcript);
      this.speak(response);
    };
  }

  start() { this.recognition.start(); }
  stop() { this.recognition.stop(); }

  speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    speechSynthesis.speak(utterance);
  }
}
```

---

## 11. AI Assistant Layer (Gemini)

### 11.1 Conversation Management

```typescript
// lib/gemini/conversationManager.ts
// Maintains multi-turn context for the session

interface ConversationTurn {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class VenueConversation {
  private history: ConversationTurn[] = [];

  constructor(private venueContext: VenueContext) {}

  async ask(userQuery: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const chat = model.startChat({
      history: this.history,
      systemInstruction: this.buildSystemPrompt()
    });

    const result = await chat.sendMessage(userQuery);
    const response = result.response.text();

    // Maintain conversation history
    this.history.push({ role: 'user', parts: [{ text: userQuery }] });
    this.history.push({ role: 'model', parts: [{ text: response }] });

    return response;
  }

  private buildSystemPrompt(): string {
    return `
You are SVOS, a helpful AI assistant at a sports venue.

CURRENT VENUE STATE (refreshed every 30s):
- Zones: ${JSON.stringify(this.venueContext.zones, null, 2)}
- Queue wait times: ${JSON.stringify(this.venueContext.queues)}
- Active alerts: ${JSON.stringify(this.venueContext.alerts)}
- User's current zone: ${this.venueContext.userZone}
- Event phase: ${this.venueContext.eventPhase}
- Time: ${new Date().toLocaleTimeString()}

RULES:
1. Always be concise — one paragraph max
2. Give specific numbers (minutes, meters, queue length)
3. If riskScore > 80 anywhere, proactively mention safe zones
4. Never make up queue times — only use data provided above
5. If no data is available for a query, say "I don't have data on that right now"
    `;
  }

  refreshContext(newContext: VenueContext) {
    this.venueContext = newContext;
  }
}
```

### 11.2 API Route for Gemini

```typescript
// app/api/assistant/route.ts
import { VenueConversation } from '@/lib/gemini/conversationManager';
import { getVenueCrowdState } from '@/lib/firebase/venueState';
import { verifySessionCookie } from '@/lib/firebase/admin';
import { z } from 'zod';

const QuerySchema = z.object({
  query: z.string().min(1).max(500),
  venueId: z.string(),
  conversationId: z.string().optional()
});

// In-memory conversation store (use Redis in production)
const conversations = new Map<string, VenueConversation>();

export async function POST(req: Request) {
  // Auth check
  const session = req.headers.get('cookie');
  const user = await verifySessionCookie(session ?? '');
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Input validation
  const body = await req.json();
  const parsed = QuerySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { query, venueId, conversationId } = parsed.data;
  const convKey = conversationId ?? user.uid;

  // Get or create conversation
  if (!conversations.has(convKey)) {
    const context = await getVenueCrowdState(venueId);
    conversations.set(convKey, new VenueConversation(context));
  }

  const conversation = conversations.get(convKey)!;

  // Refresh context with latest data
  const freshContext = await getVenueCrowdState(venueId);
  conversation.refreshContext(freshContext);

  try {
    const answer = await conversation.ask(query);
    return Response.json({ answer, conversationId: convKey });
  } catch (err) {
    console.error('Gemini error:', err);
    return Response.json({ error: 'Assistant unavailable. Please try again.' }, { status: 503 });
  }
}
```

---

## 12. Operations Command Center

### 12.1 Operator Dashboard Features

```typescript
// app/operator/page.tsx — Protected by middleware (role: operator)

export default function OperatorDashboard() {
  return (
    <OperatorLayout>
      {/* Live crowd heatmap — full venue overview */}
      <LiveCrowdHeatmap venueId={venueId} refreshIntervalMs={5000} />

      {/* Active alerts panel */}
      <AlertsPanel alerts={activeAlerts} onOverride={handleOverride} />

      {/* Zone-by-zone table: density, trend, action */}
      <ZoneTable zones={venueState.zones} onDispatchStaff={handleDispatch} />

      {/* Queue status across all vendors */}
      <QueueOverview queues={venueState.queues} />

      {/* Staff coordination map */}
      <StaffLocationMap staffMembers={onDutyStaff} />

      {/* Emergency override panel */}
      <EmergencyOverride onTrigger={handleEmergencyBroadcast} />
    </OperatorLayout>
  );
}
```

### 12.2 Emergency Broadcast

```typescript
// lib/operator/emergency.ts
export async function triggerEmergencyBroadcast(
  venueId: string,
  message: string,
  operatorUid: string
) {
  // 1. Write to Firebase — all connected clients pick this up instantly
  await db.ref(`venues/${venueId}/emergency`).set({
    active: true,
    message,
    triggeredBy: operatorUid,
    timestamp: Date.now()
  });

  // 2. Send FCM to ALL users in venue
  const tokens = await getAllVenueUserFCMTokens(venueId);
  await sendBulkFCMNotification(tokens, {
    title: '⚠️ VENUE ALERT',
    body: message,
    priority: 'high'
  });

  // 3. Log to Google Cloud Logging for audit
  await logCrowdEvent({
    type: 'EMERGENCY_BROADCAST',
    venueId,
    operatorUid,
    message,
    timestamp: Date.now()
  });
}
```

### 12.3 Staff Dispatch Logic

```typescript
// When a zone hits HIGH/CRITICAL, suggest staff redeployment
export function suggestStaffDispatch(
  crowdState: VenueCrowdState,
  availableStaff: StaffMember[]
): DispatchSuggestion[] {
  const hotZones = Object.entries(crowdState.zones)
    .filter(([, score]) => score.congestionLevel === 'HIGH' || score.congestionLevel === 'CRITICAL')
    .sort(([, a], [, b]) => b.riskScore - a.riskScore);

  return hotZones.map(([zoneId, score]) => {
    const nearestStaff = findNearestAvailableStaff(zoneId, availableStaff);
    return {
      zoneId,
      riskScore: score.riskScore,
      suggestedStaff: nearestStaff,
      action: score.congestionLevel === 'CRITICAL' ? 'IMMEDIATE_DISPATCH' : 'STANDBY_ALERT'
    };
  });
}
```

---

## 13. Learning & Feedback Loop

### 13.1 User Behavior Tracking

```typescript
// lib/analytics/behaviorTracker.ts
// All events logged to Firebase Analytics + Cloud Logging

type BehaviorEvent =
  | { type: 'NUDGE_ACCEPTED'; nudgeType: NudgeType; zone: string }
  | { type: 'NUDGE_DISMISSED'; nudgeType: NudgeType; zone: string }
  | { type: 'ROUTE_COMPLETED'; routeId: string; actualTimeSeconds: number }
  | { type: 'QUEUE_JOINED'; vendorId: string; positionAtJoin: number }
  | { type: 'QUEUE_ABANDONED'; vendorId: string; waitedSeconds: number }
  | { type: 'ASSISTANT_QUERY'; query: string; helpful: boolean | null };

export async function logBehavior(uid: string, event: BehaviorEvent) {
  // Firebase Analytics (client-side)
  logEvent(analytics, event.type, { uid, ...event });

  // Cloud Logging (server-side for ML training data)
  await logCrowdEvent({ uid, ...event, timestamp: Date.now() });
}
```

### 13.2 Model Retraining Trigger

```typescript
// Cloud Run job — runs nightly
export async function evaluateModelAccuracy() {
  const predictions = await getPredictionsFromLastDay();
  const actuals = await getActualDensitiesFromLastDay();

  const maeErrors = predictions.map((pred, i) =>
    Math.abs(pred.value - actuals[i].value)
  );

  const meanMAE = maeErrors.reduce((a, b) => a + b, 0) / maeErrors.length;

  // If prediction error > 10%, trigger retraining
  if (meanMAE > 0.10) {
    await triggerVertexAIRetraining();
    await logCrowdEvent({ type: 'MODEL_RETRAIN_TRIGGERED', meanMAE, timestamp: Date.now() });
  }
}
```

---

## 14. Security Workflow

### 14.1 Security Checklist

| Layer | Measure | Implementation |
|---|---|---|
| Auth | Firebase Auth + session cookies | httpOnly, Secure, SameSite=Strict |
| API | JWT verification on every request | Firebase Admin SDK `verifyIdToken` |
| Authorization | Role-based claims | Firebase custom claims + middleware |
| Input | Schema validation on all inputs | Zod schemas on every API route |
| Rate limiting | Per-user API throttling | Upstash Redis rate limiter |
| Secrets | Zero hardcoded credentials | All secrets in env vars / Secret Manager |
| Database | Least-privilege Firebase Rules | Users can only read/write own data |
| XSS | React auto-escaping + CSP headers | Next.js headers config |
| HTTPS | Forced SSL | Firebase Hosting enforces HTTPS |
| Logging | Audit trail for operator actions | Google Cloud Logging |

### 14.2 Input Validation (Zod)

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const LocationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100),
  venueId: z.string().uuid()
});

export const QueueJoinSchema = z.object({
  vendorId: z.string().min(1).max(50),
  venueId: z.string().uuid()
});

export const AssistantQuerySchema = z.object({
  query: z.string().min(1).max(500).trim(),
  venueId: z.string().uuid()
});
```

### 14.3 Rate Limiting

```typescript
// lib/security/rateLimiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'),   // 30 requests/minute per user
  analytics: true
});

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const { success } = await ratelimit.limit(identifier);
  return success;
}

// Apply in API route
export async function POST(req: Request) {
  const uid = await getUidFromRequest(req);
  const allowed = await checkRateLimit(uid);
  if (!allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  // ... continue
}
```

### 14.4 Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' https://maps.googleapis.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https://maps.gstatic.com https://maps.googleapis.com",
      "connect-src 'self' https://*.firebaseio.com https://firestore.googleapis.com wss://*.firebaseio.com",
      "frame-src 'none'"
    ].join('; ')
  }
];
```

---

## 15. Testing Strategy

### 15.1 Testing Pyramid

```
        ┌─────────────┐
        │    E2E      │  (Playwright) — 5% of tests
        │  (Slow)     │
       ┌┴─────────────┴┐
       │ Integration   │  (Jest + Testing Library) — 25%
       │  (Medium)     │
      ┌┴───────────────┴┐
      │   Unit Tests    │  (Jest) — 70% of tests
      │   (Fast)        │
      └─────────────────┘
```

### 15.2 Unit Tests

```typescript
// __tests__/unit/crowdEngine.test.ts
import { calculateCrowdScore, attachTrend } from '@/lib/engines/crowdEngine';

describe('calculateCrowdScore', () => {
  test('returns LOW for sparse zone', () => {
    const result = calculateCrowdScore({
      zoneId: 'zone_A', density: 0.1, velocity: 1.5,
      inflowRate: 5, outflowRate: 10, timestamp: Date.now()
    });
    expect(result.congestionLevel).toBe('LOW');
    expect(result.riskScore).toBeLessThan(30);
  });

  test('returns CRITICAL for overcrowded, slow-moving zone', () => {
    const result = calculateCrowdScore({
      zoneId: 'zone_A', density: 0.95, velocity: 0.2,
      inflowRate: 90, outflowRate: 10, timestamp: Date.now()
    });
    expect(result.congestionLevel).toBe('CRITICAL');
    expect(result.riskScore).toBeGreaterThan(85);
  });

  test('caps riskScore at 100', () => {
    const result = calculateCrowdScore({
      zoneId: 'zone_A', density: 1.0, velocity: 0.0,
      inflowRate: 100, outflowRate: 0, timestamp: Date.now()
    });
    expect(result.riskScore).toBeLessThanOrEqual(100);
  });
});

describe('attachTrend', () => {
  test('detects WORSENING trend when riskScore increases by >5', () => {
    const prev = { rawScore: 0.4, congestionLevel: 'MEDIUM' as const, riskScore: 40, trend: 'STABLE' as const };
    const curr = { rawScore: 0.5, congestionLevel: 'MEDIUM' as const, riskScore: 50, trend: 'STABLE' as const };
    const result = attachTrend(curr, prev);
    expect(result.trend).toBe('WORSENING');
  });

  test('detects IMPROVING trend when riskScore decreases by >5', () => {
    const prev = { rawScore: 0.6, congestionLevel: 'HIGH' as const, riskScore: 60, trend: 'STABLE' as const };
    const curr = { rawScore: 0.5, congestionLevel: 'MEDIUM' as const, riskScore: 50, trend: 'STABLE' as const };
    expect(attachTrend(curr, prev).trend).toBe('IMPROVING');
  });
});
```

```typescript
// __tests__/unit/decisionEngine.test.ts
import { selectOptimalRoute } from '@/lib/engines/decisionEngine';
import { calculateExperienceScore } from '@/lib/engines/decisionEngine';

describe('selectOptimalRoute', () => {
  const routes = [
    { routeId: 'r1', distanceMeters: 100, estimatedSeconds: 80, congestionScore: 0.8, waitTimeSeconds: 0 },
    { routeId: 'r2', distanceMeters: 150, estimatedSeconds: 100, congestionScore: 0.1, waitTimeSeconds: 0 },
    { routeId: 'r3', distanceMeters: 200, estimatedSeconds: 130, congestionScore: 0.05, waitTimeSeconds: 0 }
  ];

  test('prefers less congested route over shorter one', () => {
    const optimal = selectOptimalRoute(routes);
    // r1 is shortest but very congested — should not win
    expect(optimal.routeId).not.toBe('r1');
  });

  test('handles single route', () => {
    expect(selectOptimalRoute([routes[0]]).routeId).toBe('r1');
  });
});

describe('calculateExperienceScore', () => {
  test('penalizes congestion heavily', () => {
    const lowCrowd = calculateExperienceScore({
      waitTimeSeconds: 60, walkingTimeSeconds: 120, congestionExposure: 0.1, accessibilityNeeds: false
    });
    const highCrowd = calculateExperienceScore({
      waitTimeSeconds: 60, walkingTimeSeconds: 120, congestionExposure: 0.9, accessibilityNeeds: false
    });
    expect(highCrowd).toBeGreaterThan(lowCrowd);
  });

  test('adds accessibility penalty', () => {
    const base = calculateExperienceScore({
      waitTimeSeconds: 60, walkingTimeSeconds: 120, congestionExposure: 0.2, accessibilityNeeds: false
    });
    const accessible = calculateExperienceScore({
      waitTimeSeconds: 60, walkingTimeSeconds: 120, congestionExposure: 0.2, accessibilityNeeds: true
    });
    expect(accessible).toBeGreaterThan(base);
  });
});
```

```typescript
// __tests__/unit/nudgeEngine.test.ts
import { evaluateNudges } from '@/lib/engines/nudgeEngine';

describe('evaluateNudges', () => {
  test('returns SAFETY_ALERT for CRITICAL zone regardless of cooldown', () => {
    const context = {
      uid: 'user_1',
      currentZone: 'zone_A',
      zoneScore: { riskScore: 95, congestionLevel: 'CRITICAL' as const, rawScore: 0.95, trend: 'WORSENING' as const },
      nearbyZones: [{ id: 'zone_B', name: 'Section B', score: { riskScore: 20, congestionLevel: 'LOW' as const, rawScore: 0.2, trend: 'STABLE' as const } }],
      lastNudgeSentAt: Date.now() - 10000,   // Only 10s ago — within cooldown
      preferences: { accessibility: false, language: 'en' }
    };
    const nudge = evaluateNudges(context);
    expect(nudge?.type).toBe('SAFETY_ALERT');
    expect(nudge?.priority).toBe('URGENT');
  });

  test('returns null when cooldown is active for non-safety nudges', () => {
    const context = {
      uid: 'user_1',
      currentZone: 'zone_A',
      zoneScore: { riskScore: 50, congestionLevel: 'MEDIUM' as const, rawScore: 0.5, trend: 'STABLE' as const },
      nearbyZones: [{ id: 'zone_B', name: 'Section B', score: { riskScore: 10, congestionLevel: 'LOW' as const, rawScore: 0.1, trend: 'STABLE' as const } }],
      lastNudgeSentAt: Date.now() - 30000,   // Only 30s ago — within 3min cooldown
      preferences: { accessibility: false, language: 'en' }
    };
    const nudge = evaluateNudges(context);
    expect(nudge).toBeNull();
  });
});
```

```typescript
// __tests__/unit/queueEngine.test.ts
import { calculateQueueWaitTime } from '@/lib/engines/queueEngine';

describe('calculateQueueWaitTime', () => {
  test('returns correct wait in seconds', () => {
    const state = {
      vendorId: 'v1',
      slots: [],
      serviceRatePerMinute: 2   // 2 customers per minute = 30s each
    };
    expect(calculateQueueWaitTime(state, 4)).toBe(120);  // 4 people / 2 per min = 2 min = 120s
  });

  test('returns 0 for position 0', () => {
    const state = { vendorId: 'v1', slots: [], serviceRatePerMinute: 3 };
    expect(calculateQueueWaitTime(state, 0)).toBe(0);
  });
});
```

### 15.3 Integration Tests

```typescript
// __tests__/integration/apiAssistant.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/assistant/route';

jest.mock('@/lib/firebase/admin', () => ({
  verifySessionCookie: jest.fn().mockResolvedValue({ uid: 'test_user', role: 'attendee' })
}));

jest.mock('@/lib/firebase/venueState', () => ({
  getVenueCrowdState: jest.fn().mockResolvedValue({
    venueId: 'venue_001',
    zones: { zone_A: { riskScore: 30, congestionLevel: 'LOW' } },
    queues: {},
    alerts: [],
    userZone: 'zone_A',
    eventPhase: 'IN_GAME_FIRST_HALF'
  })
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          response: { text: () => 'Zone A is currently clear.' }
        })
      })
    })
  }))
}));

describe('POST /api/assistant', () => {
  test('returns 401 for unauthenticated request', async () => {
    // Override mock to return null (unauthenticated)
    const { verifySessionCookie } = require('@/lib/firebase/admin');
    verifySessionCookie.mockResolvedValueOnce(null);

    const req = new Request('http://localhost/api/assistant', {
      method: 'POST',
      body: JSON.stringify({ query: 'Where is the washroom?', venueId: '00000000-0000-0000-0000-000000000001' })
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  test('returns answer for valid query', async () => {
    const req = new Request('http://localhost/api/assistant', {
      method: 'POST',
      headers: { cookie: 'session=mock_token' },
      body: JSON.stringify({ query: 'Is Zone A crowded?', venueId: '00000000-0000-0000-0000-000000000001' })
    });

    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.answer).toBeTruthy();
  });

  test('returns 400 for empty query', async () => {
    const req = new Request('http://localhost/api/assistant', {
      method: 'POST',
      headers: { cookie: 'session=mock_token' },
      body: JSON.stringify({ query: '', venueId: '00000000-0000-0000-0000-000000000001' })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

### 15.4 Scenario / E2E Tests

```typescript
// __tests__/e2e/crowdScenarios.test.ts (Playwright)
import { test, expect } from '@playwright/test';

test.describe('High crowd scenario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="google-signin-btn"]');
    // ... mock auth
  });

  test('shows alternate route when zone is HIGH congestion', async ({ page }) => {
    // Seed Firebase with HIGH congestion in zone_A
    await seedFirebaseState({ zone_A: { congestionLevel: 'HIGH', riskScore: 75 } });

    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="nudge-banner"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="nudge-banner"]')).toContainText('quieter');
  });

  test('activates virtual queue when wait > threshold', async ({ page }) => {
    await seedFirebaseState({ vendor_1: { peopleAhead: 12, estimatedWait: 360 } });

    await page.goto('/vendors');
    await page.click('[data-testid="join-queue-vendor_1"]');
    await expect(page.locator('[data-testid="queue-confirmation"]')).toBeVisible();
  });
});

test.describe('Emergency scenario', () => {
  test('emergency banner shows for all users when broadcast triggered', async ({ page }) => {
    await page.goto('/dashboard');
    await triggerEmergencyBroadcastViaAdmin('Please proceed to nearest exit.');
    await expect(page.locator('[data-testid="emergency-banner"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="emergency-banner"]')).toContainText('nearest exit');
  });
});
```

### 15.5 Jest Configuration

```json
// jest.config.json
{
  "testEnvironment": "jsdom",
  "setupFilesAfterFramework": ["<rootDir>/jest.setup.ts"],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  "collectCoverageFrom": [
    "src/lib/engines/**/*.ts",
    "src/app/api/**/*.ts",
    "src/components/**/*.tsx"
  ],
  "coverageThresholds": {
    "global": {
      "branches": 80,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  }
}
```

---

## 16. Accessibility Workflow

### 16.1 WCAG 2.1 AA Compliance Checklist

| Criterion | Implementation |
|---|---|
| 1.1.1 Non-text content | All icons have `aria-label` or `alt` |
| 1.4.3 Contrast ratio | All text ≥ 4.5:1 (verified with Tailwind color pairs) |
| 1.4.4 Resize text | Tailwind rem units, no fixed px for text |
| 2.1.1 Keyboard accessible | All interactive elements focusable; tab order logical |
| 2.4.3 Focus order | Custom focus ring: `focus:ring-2 focus:ring-blue-500` |
| 2.4.7 Focus visible | Never removes `:focus-visible` outline |
| 3.1.1 Language of page | `<html lang="en">` always set |
| 4.1.2 Name, Role, Value | All custom components use correct ARIA roles |
| 4.1.3 Status messages | Live alerts use `aria-live="assertive"` |

### 16.2 Screen Reader Support

```typescript
// components/CrowdStatusCard.tsx
export function CrowdStatusCard({ zone, score }: { zone: string; score: CrowdScore }) {
  const levelDescriptions = {
    LOW: 'low crowd density, safe to move through',
    MEDIUM: 'moderate crowd density',
    HIGH: 'high crowd density, consider alternate route',
    CRITICAL: 'critically overcrowded, please move to safety'
  };

  return (
    <div
      role="status"
      aria-label={`Zone ${zone}: ${levelDescriptions[score.congestionLevel]}, risk score ${score.riskScore} out of 100`}
      className="p-4 rounded-lg border"
    >
      {/* Visual display */}
      <span className="sr-only">{levelDescriptions[score.congestionLevel]}</span>
      <CrowdIndicator level={score.congestionLevel} />
      <span aria-hidden="true">{zone}</span>
    </div>
  );
}
```

### 16.3 High-Contrast Mode

```css
/* styles/globals.css */
@media (prefers-contrast: high) {
  .crowd-low { background-color: #006600; color: #ffffff; }
  .crowd-medium { background-color: #886600; color: #ffffff; }
  .crowd-high { background-color: #cc3300; color: #ffffff; }
  .crowd-critical { background-color: #000000; color: #ffff00; border: 2px solid #ffff00; }
}

@media (prefers-reduced-motion: reduce) {
  .nudge-animation { animation: none !important; transition: none !important; }
}
```

### 16.4 Voice Commands

```typescript
// Supported voice commands
const VOICE_COMMANDS = {
  'navigate to my seat': () => navigate('/navigate?to=seat'),
  'where is the washroom': () => askAssistant('nearest washroom with short wait'),
  'show crowd map': () => navigate('/map'),
  'join food queue': () => navigate('/vendors'),
  'best time for food': () => askAssistant('best time to get food'),
  'safe exit': () => askAssistant('which exit is safest right now'),
  'help': () => speak('Available commands: navigate to seat, show crowd map, join food queue, safe exit')
};
```

### 16.5 Reduced Cognitive Load Design

- Maximum 1 nudge visible at a time
- Decisions presented as max 2 options ("Go now" vs "Wait")
- Color + icon + text for all status indicators (never color alone)
- Simple language: reading level Grade 6 or below for all alerts

---

## 17. Efficiency & Performance Strategy

### 17.1 Frontend Optimizations

```typescript
// 1. Debounce location updates — max 1/5s per user
const debouncedLocationUpdate = useMemo(
  () => debounce(updateLocationInFirebase, 5000),
  []
);

// 2. Lazy load heavy components
const VenueMap = dynamic(() => import('@/components/VenueMap'), {
  loading: () => <MapSkeleton />,
  ssr: false   // Google Maps requires browser
});

const OperatorDashboard = dynamic(() => import('@/components/OperatorDashboard'), {
  ssr: false
});

// 3. Route pre-fetching for likely navigation
<Link href="/navigate" prefetch={true}>Navigate</Link>
```

### 17.2 Data Fetching Strategy

```typescript
// Incremental updates — never full reload

// ✅ Firebase RT DB listener — only changed nodes are sent
const unsubscribe = onValue(
  ref(db, `venues/${venueId}/zones`),
  (snapshot) => {
    // Only updated zones pushed — not entire venue state
    updateZones(snapshot.val());
  }
);

// ✅ Cache static data (venue layout, zone polygons) in memory
const venueLayoutCache = new Map<string, VenueLayout>();
export function getVenueLayout(venueId: string): VenueLayout {
  if (venueLayoutCache.has(venueId)) return venueLayoutCache.get(venueId)!;
  const layout = fetchVenueLayout(venueId);
  venueLayoutCache.set(venueId, layout);
  return layout;
}

// ✅ SWR for REST data with stale-while-revalidate
const { data: vendorList } = useSWR(`/api/venues/${venueId}/vendors`, fetcher, {
  refreshInterval: 30000,   // Vendor list changes slowly
  revalidateOnFocus: false
});
```

### 17.3 Backend Optimizations

```typescript
// ✅ Cache Gemini responses for identical queries within 60s
const queryCache = new Map<string, { response: string; timestamp: number }>();

export async function cachedAskAssistant(query: string, context: VenueContext) {
  const cacheKey = `${query}_${context.userZone}_${context.eventPhase}`;
  const cached = queryCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.response;
  }

  const response = await askVenueAssistant(query, context);
  queryCache.set(cacheKey, { response, timestamp: Date.now() });
  return response;
}
```

---

## 18. Project Structure

```
svos/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx        # Google Sign-In page
│   │   └── unauthorized/page.tsx
│   ├── (attendee)/
│   │   ├── dashboard/page.tsx    # Main attendee view
│   │   ├── navigate/page.tsx     # Route navigation
│   │   ├── vendors/page.tsx      # Queue management
│   │   └── assistant/page.tsx    # Gemini chat UI
│   ├── (operator)/
│   │   └── operator/page.tsx     # Ops command center (protected)
│   ├── api/
│   │   ├── assistant/route.ts    # Gemini API route
│   │   ├── auth/session/route.ts # Session management
│   │   ├── crowd/route.ts        # Crowd state
│   │   ├── routes/route.ts       # Route optimization
│   │   ├── queue/route.ts        # Virtual queue
│   │   └── nudge/route.ts        # Nudge pipeline
│   ├── layout.tsx
│   └── page.tsx                  # Landing / redirect
│
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── VenueMap.tsx
│   ├── NudgeBanner.tsx
│   ├── CrowdStatusCard.tsx
│   ├── QueueCard.tsx
│   ├── AssistantChat.tsx
│   └── EmergencyBanner.tsx
│
├── lib/
│   ├── engines/
│   │   ├── crowdEngine.ts
│   │   ├── predictionEngine.ts
│   │   ├── decisionEngine.ts
│   │   ├── nudgeEngine.ts
│   │   └── queueEngine.ts
│   ├── firebase/
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   ├── admin.ts              # Server-only Firebase Admin
│   │   ├── messaging.ts
│   │   └── venueState.ts
│   ├── gemini/
│   │   ├── assistant.ts
│   │   └── conversationManager.ts
│   ├── google/
│   │   └── routes.ts
│   ├── security/
│   │   └── rateLimiter.ts
│   ├── sensors/
│   │   ├── locationProcessor.ts
│   │   └── zoneResolver.ts
│   ├── analytics/
│   │   └── behaviorTracker.ts
│   └── validation/
│       └── schemas.ts
│
├── __tests__/
│   ├── unit/
│   │   ├── crowdEngine.test.ts
│   │   ├── decisionEngine.test.ts
│   │   ├── nudgeEngine.test.ts
│   │   └── queueEngine.test.ts
│   ├── integration/
│   │   └── apiAssistant.test.ts
│   └── e2e/
│       └── crowdScenarios.test.ts
│
├── ml/
│   └── train_prediction_model.py  # Vertex AI training script
│
├── middleware.ts                   # Auth + RBAC middleware
├── next.config.js                  # CSP headers, security
├── tailwind.config.ts
├── jest.config.json
├── playwright.config.ts
├── .env.example                    # All env vars documented
├── firebase.json
├── firestore.rules
├── README.md
└── WORKFLOW.md
```

---

## 19. Environment & Configuration

```bash
# .env.example — ALL secrets documented (never commit real values)

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FCM_VAPID_KEY=

# Firebase Admin (server-side only — never prefix with NEXT_PUBLIC_)
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=

# Google Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAP_ID=
GOOGLE_ROUTES_API_KEY=

# Gemini AI
GEMINI_API_KEY=

# Vertex AI
GOOGLE_CLOUD_PROJECT=
VERTEX_AI_ENDPOINT_ID=

# Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 20. README Summary

```markdown
# SVOS — Smart Venue Operating System

## Vertical
Smart Venues / Event Technology

## Problem
Large-scale sporting events cause crowd bottlenecks, long queues,
poor navigation, and high attendee frustration. Operators lack real-time
visibility to respond quickly.

## Solution
SVOS is a closed-loop intelligent system that:
1. Senses crowd movement via GPS + simulated IoT sensors
2. Predicts congestion 15 minutes ahead using Vertex AI
3. Decides optimal routes and virtual queue slots
4. Guides users via smart nudges (low friction)
5. Answers natural language queries via Gemini AI assistant
6. Gives operators a live command center

## How It Works
Attendee opens app → Google Sign-In (Firebase Auth) →
Location tracked (debounced) → Crowd Engine scores zones →
Prediction Engine forecasts next 15 min → Decision Engine computes optimal
route/queue → Nudge Engine delivers context-aware suggestions →
Gemini answers free-form questions → Behavior logged → Model improves

## Google Services Used
| Service | Role |
|---|---|
| Firebase Auth | Secure Google Sign-In, session management |
| Firebase Realtime DB | Sub-100ms crowd state sync |
| Google Maps JS API | Venue map, heatmap, indoor navigation |
| Google Routes API | Pedestrian route optimization |
| Gemini 1.5 Pro | Natural language AI assistant |
| Vertex AI | Crowd prediction model training & serving |
| Firebase Cloud Messaging | Push nudges & alerts |
| Google Cloud Monitoring | Observability & audit logging |

## Assumptions
- GPS used with ~50m accuracy indoors (WiFi positioning enhancement optional)
- Crowd sensor data is simulated for demo (real deployment: IoT + camera)
- Service rates provided by vendors via app
- Users opt-in for location tracking
- Firebase free tier sufficient for hackathon scale

## Local Development
```bash
cp .env.example .env.local    # Fill in API keys
npm install
npm run dev                   # http://localhost:3000
npm test                      # Unit + integration tests
npm run test:e2e              # Playwright E2E tests
```
```

---

*End of WORKFLOW Document — SVOS v2.0.0*
*Google Solution Challenge — Smart Venues Vertical*
