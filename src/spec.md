# Specification

## Summary
**Goal:** Fix the Live “Server Cases Loading Failed” issue by removing any remaining frontend call paths to the deprecated `getAllSurgeryCases()` backend method and redeploying with fresh backend TypeScript bindings.

**Planned changes:**
- Audit `frontend/src/components/cases/CaseList.tsx` and its dependent case-loading flows (via `useCasesStore()` / `useGetSurgeryCasesPaginated()`) to ensure no runtime path calls `getAllSurgeryCases()`.
- Replace any remaining legacy case-loading usage with the paginated API `getSurgeryCases(start, limit)` (directly or through the existing pagination helper).
- Run a repo-wide check under `frontend/src` to confirm there are no references to `getAllSurgeryCases` (excluding generated declarations).
- Rebuild and redeploy the Live frontend using freshly generated backend TypeScript bindings, confirming the generated `backend.did.d.ts` does not include `getAllSurgeryCases`.

**User-visible outcome:** Authenticated users can load server cases on the Live site without seeing the “Server Cases Loading Failed” banner caused by a missing/removed backend method.
