# Environment Variables Setup Guide

## NEXT_PUBLIC_API_URL

This environment variable tells your Next.js frontend where to find your backend API.

## How to Retrieve/Get the Value

### Option 1: Local Development (Default)
If running backend locally:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Option 2: Deployed Backend
If your backend is deployed, use the deployment URL:

**AWS Lambda/API Gateway:**
- Check your API Gateway console
- Format: `https://[api-id].execute-api.[region].amazonaws.com/[stage]`
- Example: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`

**Custom Domain:**
- Use your custom domain
- Example: `https://api.workout-copilot.aws.com`

**Other Services:**
- Heroku: `https://your-app.herokuapp.com`
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`

## How to Set It Up

### Local Development

1. Create `frontend/.env.local` file:
```bash
cd frontend
touch .env.local
```

2. Add the variable:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

3. Restart your Next.js dev server:
```bash
npm run dev
```

### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Enter:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your backend API URL (e.g., `https://api.workout-copilot.aws.com`)
5. Select environments: **Production**, **Preview**, **Development**
6. Click **"Save"**
7. Redeploy your application

## How It's Used in Code

The variable is retrieved in your code like this:

```typescript
// frontend/lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

**Important Notes:**
- `NEXT_PUBLIC_` prefix makes it available in the browser
- It's read at build time, so you need to rebuild/redeploy after changing it
- The fallback value `http://localhost:3001` is used if the variable is not set

## Finding Your Backend URL

### If Backend is Not Deployed Yet

1. **Check your backend deployment:**
   - AWS: Check API Gateway or Lambda function URL
   - Other services: Check your service dashboard

2. **Test the backend URL:**
   ```bash
   curl https://your-backend-url.com/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

3. **Use that URL** as your `NEXT_PUBLIC_API_URL`

### If Backend Runs Locally

For local development, use:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Make sure your backend is running on port 3001 (default).

## Verification

After setting the variable:

1. **In Local Development:**
   - Check browser console: `console.log(process.env.NEXT_PUBLIC_API_URL)`
   - Should show: `http://localhost:3001`

2. **In Production:**
   - Check Network tab in browser DevTools
   - API requests should go to your backend URL
   - Not `localhost:3001`

## Common Issues

### Issue: API calls going to localhost in production
**Solution**: Make sure `NEXT_PUBLIC_API_URL` is set in Vercel environment variables

### Issue: CORS errors
**Solution**: 
- Make sure backend `CORS_ORIGIN` includes your Vercel domain
- Example: `CORS_ORIGIN=https://your-app.vercel.app`

### Issue: Variable not updating
**Solution**: 
- Rebuild/redeploy after changing environment variables
- Clear browser cache
- Check that variable name is exactly `NEXT_PUBLIC_API_URL` (case-sensitive)

## Example Values

```env
# Local development
NEXT_PUBLIC_API_URL=http://localhost:3001

# Production (AWS)
NEXT_PUBLIC_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod

# Production (Custom domain)
NEXT_PUBLIC_API_URL=https://api.workout-copilot.aws.com

# Staging/Preview
NEXT_PUBLIC_API_URL=https://staging-api.workout-copilot.aws.com
```

## Quick Reference

| Environment | Value |
|------------|-------|
| Local Dev | `http://localhost:3001` |
| Production | Your deployed backend URL |
| Preview | Your staging backend URL (if different) |
