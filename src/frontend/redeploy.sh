#!/bin/bash

# Deterministic Redeploy Script for Surgery Case Tracker
# This script performs end-to-end redeploy: clean rebuild + frontend deployment

set -euo pipefail  # Exit on any error, undefined variable, or pipe failure

echo "🚀 Starting deterministic redeploy process..."
echo ""

# Ensure we're in the repo root
if [ ! -f "dfx.json" ]; then
    echo "❌ ERROR: dfx.json not found. Please run this script from the repository root."
    exit 1
fi

# Step 1: Run clean rebuild
echo "📦 Step 1: Running clean rebuild..."
bash frontend/scripts/clean-rebuild-frontend.sh
if [ $? -ne 0 ]; then
    echo "❌ Clean rebuild failed. Aborting redeploy."
    exit 1
fi
echo ""

# Step 2: Deploy frontend
echo "🌐 Step 2: Deploying frontend to network..."
dfx deploy frontend
echo "✅ Frontend deployed successfully"
echo ""

# Step 3: Get deployment info and detect network
BACKEND_ID=$(dfx canister id backend)
FRONTEND_ID=$(dfx canister id frontend)

# Detect network more reliably
NETWORK="local"
if dfx ping ic > /dev/null 2>&1; then
    NETWORK="mainnet"
elif dfx ping local > /dev/null 2>&1; then
    NETWORK="local"
fi

echo "✨ Redeploy complete!"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "                    DEPLOYMENT SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Network:              $NETWORK"
echo "Backend canister ID:  $BACKEND_ID"
echo "Frontend canister ID: $FRONTEND_ID"
echo ""

if [ "$NETWORK" = "mainnet" ]; then
    FRONTEND_URL="https://${FRONTEND_ID}.ic0.app"
    echo "🌐 Live frontend URL: $FRONTEND_URL"
else
    FRONTEND_URL="http://${FRONTEND_ID}.localhost:4943"
    echo "🌐 Local frontend URL: $FRONTEND_URL"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANT: Hard refresh required!"
echo ""
echo "To avoid cached assets, perform a hard refresh in your browser:"
echo "  • Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)"
echo "  • Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)"
echo "  • Safari: Cmd+Option+R (Mac)"
echo ""
echo "📋 Verification checklist:"
echo "  1. Hard refresh the Live URL above"
echo "  2. Check that the app loads without backend connection errors"
echo "  3. Verify you can log in and see your cases"
echo "  4. Test creating/editing a case to confirm backend communication"
echo ""
echo "📖 For detailed verification steps, see:"
echo "   frontend/scripts/verify-live-backend-binding.md"
echo ""
