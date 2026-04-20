# SVOS Verification & Testing Manifest

SVOS utilizes a multi-layered testing strategy to ensure reliability during high-stakes stadium events.

## 1. Test Strategy Overview

| Level | Tool | Scope |
|---|---|---|
| **Unit** | Jest | Logic engines (`crowd`, `nudge`, `prediction`). |
| **Integration** | Jest | End-to-end "Sense-Predict-Act" loop verification. |
| **Component** | RTL + Jest | UI accessibility and state-reactive rendering. |
| **Security** | Jest | Proxy RBAC and Rate Limit validation. |

## 2. Key Test Suites

### The "Intelligence Loop" Test
Located in `__tests__/integration.test.ts`, this suite verifies that raw data input (Sense) leads to accurate forecasting (Predict) which correctly triggers the appropriate automated response (Act).

### Boundary Condition Suite
Located in `__tests__/boundary.test.ts`, this suite stress-tests the engines with:
- Zero/Negative density metrics.
- 500% over-capacity scenarios.
- Massive inflow/outflow deltas.

### Security Proxy Suite
Located in `__tests__/security.test.ts`, this suite validates that unauthorized users are redirected and that the sliding-window rate limiter correctly identifies and blocks "bad actors."

## 3. Coverage Targets
Current baseline coverage for core engines: **100% Path Coverage**.
All builds require a perfect pass of the ESLint suite with zero warnings/errors.
