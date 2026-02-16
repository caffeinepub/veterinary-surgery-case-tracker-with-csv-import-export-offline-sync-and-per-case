# Specification

## Summary
**Goal:** Restore Live frontend connectivity to the currently deployed backend by performing a clean rebuild/redeploy and adding a backend compatibility method required by existing frontend initialization.

**Planned changes:**
- Perform a fresh clean rebuild and redeploy of both backend and frontend canisters to eliminate stale build artifacts and ensure the Live frontend references the current backend canister ID and freshly generated bindings.
- Update the Motoko backend actor (backend/main.mo) to expose a public `_initializeAccessControlWithSecret(secret : Text) : async ()` method that safely no-ops and returns successfully for compatibility with the existing Live frontend.

**User-visible outcome:** Opening the Live Surgery Case Tracker app no longer shows the backend connection initialization error, and the app connects to the currently deployed backend successfully.
