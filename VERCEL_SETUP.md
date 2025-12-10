# Vercel Deployment Guide

Complete step-by-step guide to deploy the Workout & Supplement Copilot frontend to Vercel.

## Prerequisites

- GitHub account with the repository pushed
- Vercel account (sign up at https://vercel.com)
- Backend API URL (if you have one deployed)

## Step 1: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub account and find `workout-supplement-copilot`
5. Click **"Import"**

## Step 2: Configure Project Settings

### Important: Root Directory

**DO NOT set Root Directory to `frontend`** - Keep it as the repository root (default/empty).

The `vercel.json` file is configured to build from the `frontend/` directory, and the frontend needs access to the `shared/` package via TypeScript path mapping.

### Framework Preset

- Vercel should auto-detect **Next.js** from the root `package.json`
- If it doesn't, manually select **Next.js**

### Build Settings

The `vercel.json` file handles these automatically:
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `cd frontend && npm install`

You can leave these as default or verify they match `vercel.json`.

## Step 3: Environment Variables

Add these in **Project Settings** → **Environment Variables**:

### Required:
- `NEXT_PUBLIC_API_URL` - Your backend API URL
  - Example: `https://api.workout-copilot.aws.com`
  - Or for local testing: `http://localhost:3001`

### Optional (if needed):
- Any other environment variables your frontend needs

**Important**: 
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Add the same variables for **Production**, **Preview**, and **Development** environments

## Step 4: Deploy

1. Click **"Deploy"** button
2. Wait for the build to complete
3. Vercel will provide you with a deployment URL (e.g., `https://workout-supplement-copilot.vercel.app`)

## Step 5: Verify Deployment

1. Visit your deployment URL
2. Check the browser console for any errors
3. Verify API calls are working (check Network tab)

## Troubleshooting

### Error: "No Next.js version detected"

**Solution**: 
- Make sure Root Directory is **NOT** set to `frontend` (keep it as repository root)
- The root `package.json` contains Next.js for detection
- The `vercel.json` handles building from the `frontend/` directory

### Error: "Command cd frontend && npm install exited with 1"

**Solution**:
- Ensure `package-lock.json` exists in the `frontend/` directory
- Check that Node.js version is 18+ (set in Vercel project settings)
- The `vercel.json` uses `npm install` which should work

### Error: "404: NOT_FOUND"

**Solution**:
- Verify the build completed successfully
- Check that `outputDirectory` in `vercel.json` is `frontend/.next`
- Ensure Root Directory is set to repository root (not `frontend`)

### Error: "Failed to fetch one or more git submodules"

**Solution**:
- This warning is harmless and can be ignored
- The repository has no submodules
- It's been disabled in GitHub Actions workflows

### Build Fails with TypeScript Errors

**Solution**:
- The frontend uses TypeScript path mapping for `@workout-copilot/shared`
- Ensure Root Directory is repository root so `../shared/src` is accessible
- Check that `frontend/tsconfig.json` has the correct path mapping

## Project Settings Summary

In Vercel Project Settings → General:

- **Root Directory**: Leave empty (repository root) ✅
- **Framework Preset**: Next.js
- **Build Command**: (handled by vercel.json)
- **Output Directory**: (handled by vercel.json)
- **Install Command**: (handled by vercel.json)
- **Node.js Version**: 18.x or higher

## Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificates

## Continuous Deployment

Once connected:
- Every push to `main` branch = automatic production deployment
- Pull requests = automatic preview deployments
- You can disable auto-deploy in project settings if needed

## API Rewrites

The `vercel.json` includes API rewrites:
- `/api/*` requests are proxied to your backend API
- Update the destination URL in `vercel.json` if your backend URL changes

## Support

If you encounter issues:
1. Check Vercel build logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Root Directory is repository root (not `frontend`)
4. Check that `vercel.json` is in the repository root
