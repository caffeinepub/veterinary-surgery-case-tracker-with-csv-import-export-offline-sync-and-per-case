# Deployment Notes - Surgery Case Tracker

## Observed Error

During the build process, TypeScript compilation failed with an error related to the `useActor.ts` hook attempting to call a non-existent method `_initializeAccessControlWithSecret()` on the backend actor.

**Error symptoms:**
- Build fails during TypeScript compilation
- Error message indicates that the method `_initializeAccessControlWithSecret` does not exist on the backend interface
- Deployment cannot proceed due to compilation failure

## Root Cause

The `useActor.ts` hook was attempting to call `actor._initializeAccessControlWithSecret(adminToken)` after creating the actor instance. However, this method is not part of the public backend interface defined in `frontend/src/backend.d.ts`.

The backend's authorization system (via `MixinAuthorization`) handles access control initialization automatically when the canister is deployed. The frontend does not need to (and cannot) manually initialize the access control system.

**Key insight:** The authorization mixin in the backend automatically initializes access control state during canister deployment. Client-side initialization is neither necessary nor supported through the public API.

## Fix Applied

**Modified files:**
1. `frontend/src/hooks/useActor.ts` - Removed the call to `_initializeAccessControlWithSecret()` and added a comment explaining that the backend handles initialization automatically
2. `frontend/src/hooks/useActorWithError.ts` - Removed references to draft admin token checking since it's no longer needed for actor initialization

**Changes:**
- Removed line 30 from `useActor.ts`: `await actor._initializeAccessControlWithSecret(adminToken);`
- Removed imports and logic related to `draftAdminToken` utilities from `useActorWithError.ts`
- Added explicit `UseActorReturn` interface export to `useActor.ts` for better type safety

## Redeploy Steps

Follow these steps to perform a clean build and redeploy from a fresh checkout:

### Prerequisites
- Node.js (v18 or later)
- pnpm package manager
- dfx (Internet Computer SDK)
- Internet connection for downloading dependencies

### Step-by-Step Instructions

1. **Clean any existing build artifacts:**
   ```bash
   # Remove node modules and build outputs
   rm -rf frontend/node_modules
   rm -rf frontend/dist
   rm -rf .dfx
   ```

2. **Install dependencies:**
   ```bash
   cd frontend
   pnpm install
   cd ..
   ```

3. **Start local Internet Computer replica (if deploying locally):**
   ```bash
   dfx start --clean --background
   ```

4. **Deploy the backend canister:**
   ```bash
   dfx deploy backend
   ```

5. **Generate TypeScript bindings:**
   ```bash
   dfx generate backend
   ```

6. **Build the frontend:**
   ```bash
   cd frontend
   pnpm run build:skip-bindings
   cd ..
   ```

7. **Deploy the frontend canister:**
   ```bash
   dfx deploy frontend
   ```

8. **Verify deployment:**
   ```bash
   # Get the canister URLs
   dfx canister call backend getCallerUserRole
   ```

### Verification Checklist

After deployment, verify the following:

- [ ] Frontend builds without TypeScript errors
- [ ] Backend canister is deployed and responding
- [ ] Frontend canister is deployed and serving the application
- [ ] Application loads in the browser without console errors
- [ ] Login functionality works (Internet Identity integration)
- [ ] User can create and view surgery cases after authentication
- [ ] Authorization system correctly identifies user roles

### Troubleshooting

**If build still fails:**
1. Ensure all dependencies are installed: `pnpm install`
2. Clear TypeScript cache: `rm -rf frontend/node_modules/.cache`
3. Regenerate bindings: `dfx generate backend`
4. Check that `frontend/src/backend.d.ts` exists and contains the correct interface

**If deployment fails:**
1. Check dfx is running: `dfx ping`
2. Verify canister IDs are correct in `dfx.json`
3. Check wallet balance: `dfx wallet balance`
4. Review dfx logs: `dfx canister logs backend`

**If authorization errors occur:**
1. The backend automatically initializes the first authenticated user as admin
2. Ensure you're logged in with Internet Identity
3. Check user role: `dfx canister call backend getCallerUserRole`

## Additional Notes

- The authorization system uses role-based access control (RBAC) with three roles: admin, user, and guest
- The first authenticated principal is automatically assigned the admin role
- All subsequent users are assigned the user role by default
- Admins can assign roles to other users via the `assignCallerUserRole` method
- No manual initialization or admin tokens are required for the authorization system to function

## Environment-Specific Considerations

**Local Development:**
- Uses local Internet Computer replica
- Faster iteration cycles
- Data is ephemeral (cleared on `dfx start --clean`)

**IC Mainnet:**
- Requires cycles for deployment
- Data persists across deployments
- Use `--network ic` flag with dfx commands

**Staging/Draft:**
- May use different canister IDs
- Ensure correct network configuration in `dfx.json`
