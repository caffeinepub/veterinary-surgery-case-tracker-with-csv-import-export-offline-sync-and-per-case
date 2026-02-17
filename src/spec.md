# Specification

## Summary
**Goal:** Stop the case list from getting stuck in an infinite loading state after creating a case by switching to paginated server fetching, rendering local cases immediately, and showing a clear error state with retry when server loading fails.

**Planned changes:**
- Update the frontend server-cases query to use `getSurgeryCases(start, limit)` (page size <= 100) and aggregate results across pages instead of calling `getAllSurgeryCases()`.
- Ensure server-cases page fetch failures are surfaced in the UI (not an indefinite spinner) while still logging raw errors to the console.
- Adjust merged-cases rendering so locally stored cases render immediately and are not blocked by server-cases loading/errored states.
- Add an English error state for server case loading failures that includes a Retry action to re-attempt server fetching and recompute merged cases.

**User-visible outcome:** After creating a case, the new case card appears right away, and the case list no longer spins indefinitely; if server loading fails, users see a readable error with a Retry button while still being able to view any local cases.
