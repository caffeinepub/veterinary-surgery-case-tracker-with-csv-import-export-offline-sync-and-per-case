# Specification

## Summary
**Goal:** Fix the Live “backend disconnected” error by deterministically rebuilding the frontend with fresh backend bindings and redeploying the frontend canister.

**Planned changes:**
- Run the deterministic clean rebuild script (`frontend/scripts/clean-rebuild-frontend.sh`) to remove stale artifacts, regenerate TypeScript bindings from the currently deployed backend canister, and rebuild `frontend/dist`.
- Confirm regenerated bindings are present and no longer reference the legacy `getAllSurgeryCases` method (including ensuring frontend source does not reference it outside generated declarations).
- Redeploy the frontend canister using the deterministic redeploy flow (`frontend/redeploy.sh`, or clean rebuild then `dfx deploy frontend`) so Live ships the new bindings.
- Verify Live is effectively bound to the currently deployed backend canister ID by following `frontend/scripts/verify-live-backend-binding.md`.

**User-visible outcome:** The Live site loads without a backend disconnected error and shows the app as connected/online on page load.
