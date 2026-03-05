# Deployment Notes - Surgery Case Tracker

## Overview

This document describes the deterministic redeploy process for the Surgery Case Tracker frontend. The process ensures that the Live frontend always uses fresh backend bindings and references the currently deployed backend canister ID.

## When to Redeploy

Perform a complete redeploy when:

- ✅ The Live app shows "Backend Connection Error: Failed to initialize backend connection"
- ✅ Backend canister has been redeployed with a new canister ID
- ✅ Frontend bindings appear out of sync with the deployed backend
- ✅ You need to deploy frontend code changes to the Live environment
- ✅ Troubleshooting persistent connection issues between frontend and backend
- ✅ **Backend interface has changed** (methods added, removed, or renamed)
- ✅ After removing or renaming backend methods (critical - stale bindings will cause runtime errors)
- ✅ After any backend upgrade or reinstall that changes the canister ID

## Quick Redeploy (Recommended)

Use the deterministic redeploy script for a complete end-to-end redeploy:

