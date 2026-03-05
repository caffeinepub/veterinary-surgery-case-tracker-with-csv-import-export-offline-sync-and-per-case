# Specification

## Summary
**Goal:** Update VetCase Tracker’s branding and improve surgery case card demographics readability.

**Planned changes:**
- Add new cartoon-style dog+cat heads app icon assets under `frontend/public/assets/generated` and update the app/browser icon references (e.g., favicon) to use them.
- Update the case card UI so the Arrival date is shown in the top-right of the card header instead of in the demographics grid.
- Add an Age field to the case card demographics that calculates and displays age from Date of Birth in years and months (e.g., `2y 3m`) when DOB is valid.

**User-visible outcome:** The app shows a new dog+cat cartoon icon in the browser tab, and each surgery case card displays Arrival date in the header plus an automatically calculated Age field (when DOB is available).
