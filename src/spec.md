# Specification

## Summary
**Goal:** Prevent the live Sync flow from failing due to a backend canister trap (“heap out of bounds”) triggered by unbounded retrieval in `getAllSurgeryCases`, while keeping existing authorization behavior intact.

**Planned changes:**
- Update the backend `getAllSurgeryCases` retrieval approach to be memory-safe for large datasets (e.g., introduce bounded/paginated retrieval and/or reduce allocation pressure during sorting) and avoid trapping, while preserving current access control rules.
- Update the frontend sync logic in `frontend/src/hooks/useSync.ts` to use bounded/paginated and/or incremental retrieval instead of assuming all cases can be fetched in a single call, and keep the existing merge + `pendingSync` clearing behavior.
- Improve frontend sync error handling so replica rejection/trap errors show a clear English message to the user while logging the raw error details to the developer console.

**User-visible outcome:** Sync completes successfully even for users with many surgery cases, and if a backend error occurs the app shows a clear English error message instead of a raw replica rejection dump.
