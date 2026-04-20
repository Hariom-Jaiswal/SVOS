# SVOS Architecture Manifest

This document provides a technical deep-dive into the Smart Venue Operating System (SVOS) architecture, focusing on the principles of reliability, intelligence, and scale.

## 1. Core Logic: The Sense–Predict–Act Loop

SVOS follows a deterministic closed-loop intelligence cycle to manage crowd safety:

### Phase 1: Sense (`sensors/`)
Raw geolocation data is ingested through the client SDK. This data undergoes strict debouncing (5s intervals) and indoor accuracy filtering (<50m error margin) before being resolved into specific venue zones.

### Phase 2: Predict (`lib/engines/predictionEngine.ts`)
Once zone metrics are calculated, the Prediction Engine forecasts future density. 
- **Hybrid Strategy**: We use a custom **Vertex AI** endpoint for high-dimensional trend forecasting, with a deterministic **Rule-based fallback** to ensure safety metrics are generated even during network partition or cloud service latency.

### Phase 3: Act (`lib/engines/nudgeEngine.ts`)
The Nudging Engine evaluates the risk index and forecasted density to trigger "Interventions." Interventions range from low-priority vendor deals (to move crowds toward quiet zones) to **URGENT SAFETY ALERTS** that override all UI state to evacuate high-risk bottlenecks.

---

## 2. Design Pillars

### Separation of Concerns
The business logic is entirely decoupled from the Next.js UI tier. All mathematical scoring (`crowdEngine.ts`) and rule-based logic is implemented in pure TypeScript, allowing for 100% test coverage without a browser DOM.

### Reactive State Management
SVOS uses a "Global State Observer" pattern via React hooks (`useVenueAssistant`). This ensures that as soon as a density threshold is crossed in the backend (Firebase RTDB), the UI reacts instantly with high-priority nudges.

### Performance via Edge
All Google Maps routing logic is handled via an **Edge Runtime Proxy**, minimizing the TTFB (Time to First Byte) for critical safe-navigation instructions.
