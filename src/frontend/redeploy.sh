#!/bin/bash

# Deterministic Redeploy Script for Surgery Case Tracker
# This script performs end-to-end redeploy: clean rebuild + frontend deployment

set -e  # Exit on any error

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
echo ""

# Step 2: Deploy frontend
echo "🌐 Step 2: Deploying frontend to network..."
dfx deploy frontend
echo "✅ Frontend deployed successfully"
echo ""

# Step 3: Get deployment info
BACKEND_ID=$(dfx canister id backend)
FRONTEND_ID=$(dfx canister id frontend)
NETWORK=$(dfx ping | grep -q "ic" && echo "mainnet" || echo "local")

echo "✨ Redeploy complete!"
echo ""
echo "Deployment Summary:"
echo "  Network: $NETWORK"
echo "  Backend canister ID: $BACKEND_ID"
echo "  Frontend canister ID: $FRONTEND_ID"
echo ""
echo "⚠️  IMPORTANT: Verify the Live deployment"
echo "  Follow the verification guide: frontend/scripts/verify-live-backend-binding.md"
echo ""

if [ "$NETWORK" = "local" ]; then
    FRONTEND_URL="http://${FRONTEND_ID}.localhost:4943"
    echo "Local frontend URL: $FRONTEND_URL"
else
    FRONTEND_URL="https://${FRONTEND_ID}.ic0.app"
    echo "Live frontend URL: $FRONTEND_URL"
fi
echo ""
