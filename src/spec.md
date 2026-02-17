# Specification

## Summary
**Goal:** Let users delete surgery case (patient) cards safely and make the presenting complaint stand out more on each card.

**Planned changes:**
- Add a clearly visible delete control on each case card with a confirmation step, and remove the case from the list immediately after confirming.
- Implement a backend delete API to remove a case by caseId for the authenticated caller, following existing authorization rules.
- Wire the frontend deletion flow to the backend via a React Query mutation, and invalidate/refresh server and merged case queries after successful deletion.
- Visually emphasize the presenting complaint on each card using a contrasting colored container (background + border) that works in light/dark mode and wraps long text.

**User-visible outcome:** Users can delete a surgery case from its card (after confirming) and the presenting complaint is more visually prominent on each case card.
