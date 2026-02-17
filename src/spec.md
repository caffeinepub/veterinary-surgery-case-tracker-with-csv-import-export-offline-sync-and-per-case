# Specification

## Summary
**Goal:** Refactor the Motoko backend to prevent traps when loading or syncing large surgery-case datasets, restoring reliable server case loading in the live frontend.

**Planned changes:**
- Refactor per-user surgery-case storage and read paths so pagination (`getSurgeryCases(start, limit)`) never materializes an unbounded full list in memory and enforces a hard maximum page size of 100.
- Update the legacy `getAllSurgeryCases()` to have a strict, documented upper bound on returned items and avoid serializing an unbounded dataset in a single response.
- Rework `syncLocalChanges(localCases)` merge logic to avoid quadratic scans and large intermediate collections, using a bounded-memory, linear-time approach (e.g., indexing by `caseId`).

**User-visible outcome:** The frontend can load server cases and sync large case sets without “Server Cases Loading Failed” or backend trapping, even for users with many saved cases.
