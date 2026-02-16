# Deployment Notes - Surgery Case Tracker

## Clean Rebuild Process

This document describes how to perform a clean rebuild of the frontend to ensure it uses fresh backend bindings and eliminates any stale canister-id or binding artifacts.

### When to Use Clean Rebuild

Perform a clean rebuild when:
- The Live app shows "Backend Connection Error: Failed to initialize backend connection"
- Backend canister has been redeployed with a new canister ID
- Frontend bindings appear out of sync with the deployed backend
- Troubleshooting persistent connection issues between frontend and backend

### Quick Clean Rebuild

Use the provided helper script for a deterministic clean rebuild:

