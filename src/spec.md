# Specification

## Summary
**Goal:** Fix live/production backend connection initialization so authenticated actor creation and connection probing succeed without relying on non-existent backend methods or draft admin tokens.

**Planned changes:**
- Remove the frontend call to the non-existent actor method `_initializeAccessControlWithSecret(...)` during actor creation in `frontend/src/hooks/useActor.ts`.
- Stop using the `caffeineAdminToken` URL parameter for normal actor initialization and update backend connection error messaging to avoid mentioning draft/admin tokens for standard Live failures.
- Improve the backend connection probing flow (actor creation + `getCallerUserProfile` probe) to surface actionable English errors, display them via existing connection UI, and ensure “Retry Connection” re-runs initialization + probe and clears errors on success.

**User-visible outcome:** In the live app, signed-in users can reach “Backend Connected” when the canister is available; if connection/probe fails, they see a clear “Backend Connection Error: …” message and can recover via “Retry Connection” without reloading.
