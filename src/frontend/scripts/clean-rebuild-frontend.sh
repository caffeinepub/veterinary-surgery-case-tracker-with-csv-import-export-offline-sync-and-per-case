#!/bin/bash

# Clean Rebuild Script for Surgery Case Tracker Frontend
# This script performs a deterministic clean rebuild to eliminate stale artifacts

set -e  # Exit on any error

echo "🧹 Starting clean rebuild process..."
echo ""

# Step 1: Remove stale frontend build artifacts
echo "📦 Step 1: Removing stale build artifacts..."
rm -rf frontend/dist
rm -rf frontend/src/declarations
rm -rf frontend/.vite
rm -rf frontend/node_modules/.cache
echo "✅ Build artifacts removed"
echo ""

# Step 2: Ensure dependencies are installed
echo "📦 Step 2: Installing dependencies..."
cd frontend
pnpm install
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

# Step 4: Regenerate TypeScript bindings
echo "🔄 Step 4: Regenerating TypeScript bindings from deployed backend..."
dfx generate backend
echo "✅ Bindings regenerated"
echo ""

# Step 5: Verify bindings were generated
echo "🔍 Step 5: Verifying bindings..."
if [ -f "frontend/src/declarations/backend/backend.did.d.ts" ]; then
    echo "✅ Backend bindings verified"
    ls -lh frontend/src/declarations/backend/backend.did.d.ts
else
    echo "❌ ERROR: Backend bindings not found!"
    echo "Expected file: frontend/src/declarations/backend/backend.did.d.ts"
    exit 1
fi
echo ""

# Step 6: Build frontend
echo "🏗️  Step 6: Building frontend with fresh bindings..."
cd frontend
pnpm run build:skip-bindings
cd ..
echo "✅ Frontend built successfully"
echo ""

# Step 7: Summary
echo "✨ Clean rebuild complete!"
echo ""
echo "Next steps:"
echo "  1. Deploy frontend: dfx deploy frontend"
echo "  2. Verify deployment using: frontend/scripts/verify-live-backend-binding.md"
echo ""
echo "Backend canister ID: $BACKEND_ID"
echo "Frontend build output: frontend/dist"
