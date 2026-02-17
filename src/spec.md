# Specification

## Summary
**Goal:** Fix frontend server case loading so it no longer calls the deprecated `getAllSurgeryCases()` API and reliably loads cases via the paginated `getSurgeryCases(start, limit)` method.

**Planned changes:**
- Audit and update all frontend case-loading hooks/flows to remove any runtime call paths invoking `getAllSurgeryCases()` and route server case loading through `getSurgeryCases(start, limit)` (directly or via existing pagination helpers).
- Refresh generated backend bindings used by the frontend and validate redeploy steps so Live uses updated declarations and cannot call removed legacy APIs.

**User-visible outcome:** Server cases load successfully in the live/production UI without showing the “Server Cases Loading Failed” banner (assuming backend is reachable and the user is authenticated).
