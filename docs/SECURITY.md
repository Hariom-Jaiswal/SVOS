# SVOS Security Manifest

SVOS is designed for mission-critical crowd coordination, where the integrity and availability of information directly impact attendee safety.

## 1. Authentication & RBAC

- **Identity**: SVOS leverages **Firebase Auth** with Google OIDC.
- **Session Integrity**: We utilize **Stateless Session Cookies** verified server-side via the Firebase Admin SDK. 
- **RBAC (Role-Based Access Control)**: Access to the `/operator` command center is strictly enforced at the Edge (`proxy.ts`). Requests without valid operator claims are intercepted before reaching the server.

## 2. Defensive Strategies

### Denial-of-Wallet (AI Protection)
To prevent abuse of Gemini 1.5 Pro and Vertex AI API quotas, we implement **Granular Rate Limiting** in the Proxy layer. 
- Global Limit: 30 requests per minute.
- AI Specific Limit: 5 requests per minute per user.

### Content Security Policy (CSP)
SVOS implements a "Reject by Default" CSP. We explicitly whitelist only the minimum required domains for Google Maps, Firebase, and Gemini interaction.

### Transport Security
- **HSTS**: Enforced with a 2-year `max-age` including subdomains and preloading.
- **Permissions-Policy**: All browser features except `geolocation` (required for sensing) are strictly disabled to prevent side-channel attacks.

## 3. Data Privacy
Attendee geocoordinates are processed in-memory and debounced. Real-time positions in Firebase are treated as transient and subject to automated TTL (Time to Live) purging after the event concludes.
