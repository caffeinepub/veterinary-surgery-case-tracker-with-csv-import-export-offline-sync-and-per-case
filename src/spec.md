# Specification

## Summary
**Goal:** Fix Draft startup recovery so backend actor initialization failures are clearly surfaced, admin-token handling works across logout/login within a session, and retries reliably recover without page reloads.

**Planned changes:**
- Capture and propagate backend actor initialization failures (including `_initializeAccessControlWithSecret(...)`) as an explicit error state from `useActor`, and display the specific error on the StartupRecoveryScreen instead of only a generic connection failure.
- Improve Draft admin-token handling: detect missing/empty `caffeineAdminToken` at initialization time, show clear English guidance to use a Draft URL containing the token (without displaying the token), and persist/reuse the token via existing URL/session helpers in `frontend/src/utils/urlParams.ts` across logout/login within the same browser session.
- Differentiate and display accurate English messages for unauthorized vs network/service-unavailable backend failures during startup, without misclassifying actor-initialization failures as network issues.
- Update the “Retry Connection” flow to fully reset prior failed startup state and re-run actor initialization + backend probing, ensuring each retry shows the latest error (or transitions into the authenticated UI on success) without requiring a full page reload.

**User-visible outcome:** When Draft startup fails, users see a clear, specific English error (including missing-token guidance when applicable), can distinguish authorization vs connectivity issues, and can press “Retry Connection” repeatedly to recover—without reloading the page or re-entering the admin token during the same browser session.
