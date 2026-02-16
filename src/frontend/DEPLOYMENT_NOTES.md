# Deployment Notes - Surgery Case Tracker

## Redeploy

Use this process when you need to redeploy the frontend with fresh backend bindings and ensure the Live site references the currently deployed backend canister ID.

### When to Redeploy

Perform a redeploy when:
- The Live app shows "Backend Connection Error: Failed to initialize backend connection"
- Backend canister has been redeployed with a new canister ID
- Frontend bindings appear out of sync with the deployed backend
- You need to deploy frontend code changes to the Live environment
- Troubleshooting persistent connection issues between frontend and backend

### Quick Redeploy (Recommended)

Use the deterministic redeploy script for a complete end-to-end redeploy:

