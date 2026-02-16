# Specification

## Summary
**Goal:** Restore reliable authenticated frontend-to-backend connectivity and add clear, user-facing connection diagnostics (including retry) so the app no longer appears “disconnected” when backend calls fail.

**Planned changes:**
- Ensure authenticated users can successfully create/use the backend actor and complete at least one confirmed read call after login (e.g., load caller profile and fetch surgery cases) without manual refresh.
- Add a higher-level connection/initialization manager (without modifying the immutable `useActor.ts`) that captures and exposes actor initialization failures (from `createActorWithConfig(...)` and access-control initialization) as a stable, non-throwing error state.
- Add UI connection status messaging in English that distinguishes browser offline vs browser online but backend connection/authorization failure, and provide a simple retry action to re-attempt initialization/refetch data.

**User-visible outcome:** After logging in with Internet Identity, users see their profile/setup prompt and cases load from the backend normally; if connectivity/authorization fails, the app shows a clear “not connected/unauthorized” style message (distinct from offline) and offers a retry that restores normal behavior when successful.
