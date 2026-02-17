#!/bin/bash

# Clean Rebuild Script for Surgery Case Tracker Frontend
# This script performs a deterministic clean rebuild to eliminate stale artifacts

set -euo pipefail  # Exit on any error, undefined variable, or pipe failure

echo "🧹 Starting clean rebuild process..."
echo ""

# Ensure we're in the repo root or can find dfx.json
if [ ! -f "dfx.json" ]; then
    echo "❌ ERROR: dfx.json not found. Please run this script from the repository root."
    exit 1
fi

# Step 1: Remove stale frontend build artifacts
echo "📦 Step 1: Removing stale build artifacts..."
rm -rf frontend/dist
rm -rf frontend/src/declarations
rm -rf frontend/.vite
rm -rf frontend/node_modules/.cache
echo "✅ Build artifacts removed"
echo ""

# Step 2: Ensure dependencies are installed (respecting lockfile)
echo "📦 Step 2: Installing dependencies from lockfile..."
cd frontend
if [ ! -f "pnpm-lock.yaml" ]; then
    echo "⚠️  Warning: pnpm-lock.yaml not found, installing fresh..."
    pnpm install
else
    pnpm install --frozen-lockfile
fi
cd ..
echo "✅ Dependencies installed"
echo ""

# Step 3: Ensure backend is deployed
echo "🔧 Step 3: Checking backend deployment..."
if dfx canister id backend > /dev/null 2>&1; then
    BACKEND_ID=$(dfx canister id backend)
    echo "✅ Backend canister found: $BACKEND_ID"
else
    echo "⚠️  Backend canister not found. Deploying backend..."
    dfx deploy backend
    BACKEND_ID=$(dfx canister id backend)
    echo "✅ Backend deployed: $BACKEND_ID"
fi
echo ""

# Step 4: Regenerate TypeScript bindings from deployed backend
echo "🔄 Step 4: Regenerating TypeScript bindings from deployed backend..."
dfx generate backend
echo "✅ Bindings regenerated"
echo ""

# Step 5: Verify bindings were generated
echo "🔍 Step 5: Verifying bindings exist..."
if [ -f "frontend/src/declarations/backend/backend.did.d.ts" ]; then
    echo "✅ Backend bindings verified"
    BINDINGS_SIZE=$(ls -lh frontend/src/declarations/backend/backend.did.d.ts | awk '{print $5}')
    echo "   File size: $BINDINGS_SIZE"
else
    echo "❌ ERROR: Backend bindings not found!"
    echo "Expected file: frontend/src/declarations/backend/backend.did.d.ts"
    exit 1
fi
echo ""

# Step 6: Verify no legacy method references in bindings
echo "🔍 Step 6: Checking for removed legacy methods in bindings..."
if grep -q "getAllSurgeryCases" frontend/src/declarations/backend/backend.did.d.ts 2>/dev/null; then
    echo "❌ ERROR: Legacy method 'getAllSurgeryCases' found in generated bindings!"
    echo "This indicates the backend still exports the removed method."
    echo "Please ensure the backend has been deployed with the updated code."
    exit 1
fi
echo "✅ No legacy methods found in bindings"
echo ""

# Step 7: Verify no legacy method calls in frontend source
echo "🔍 Step 7: Checking for legacy method calls in frontend source..."
LEGACY_REFS=$(grep -r "getAllSurgeryCases" frontend/src --exclude-dir=declarations --exclude-dir=node_modules 2>/dev/null || true)
if [ -n "$LEGACY_REFS" ]; then
    echo "❌ ERROR: Found references to legacy method 'getAllSurgeryCases' in frontend source!"
    echo "$LEGACY_REFS"
    echo ""
    echo "Please remove all calls to this method and use getSurgeryCases(start, limit) instead."
    exit 1
fi
echo "✅ No legacy method calls found in frontend source"
echo ""

# Step 8: Build frontend
echo "🏗️  Step 8: Building frontend with fresh bindings..."
cd frontend
pnpm run build:skip-bindings
cd ..

# Verify dist was created
if [ ! -d "frontend/dist" ]; then
    echo "❌ ERROR: frontend/dist directory not created!"
    exit 1
fi

DIST_SIZE=$(du -sh frontend/dist | awk '{print $1}')
echo "✅ Frontend built successfully (dist size: $DIST_SIZE)"
echo ""

# Step 9: Summary
echo "✨ Clean rebuild complete!"
echo ""
echo "Build verification:"
echo "  ✓ Backend bindings regenerated from deployed canister"
echo "  ✓ No legacy methods in bindings"
echo "  ✓ No legacy method calls in source"
echo "  ✓ Frontend dist created successfully"
echo ""
echo "Next steps:"
echo "  1. Deploy frontend: dfx deploy frontend"
echo "  2. Verify deployment using: frontend/scripts/verify-live-backend-binding.md"
echo ""
echo "Backend canister ID: $BACKEND_ID"
echo "Frontend build output: frontend/dist ($DIST_SIZE)"
echo ""
