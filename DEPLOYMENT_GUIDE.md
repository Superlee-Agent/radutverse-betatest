# Deployment Guide - Vercel with Story Protocol

This guide covers deploying the IP Assistant application to Vercel and configuring required environment variables.

## Prerequisites

- Vercel account (https://vercel.com)
- Git repository connected to Vercel
- Required API keys (see Environment Variables section)

## Environment Variables Required

The following environment variables must be set in your Vercel project settings. Create them based on `.env.example`:

| Variable | Required | Purpose |
|----------|----------|---------|
| `STORY_API_KEY` | ✅ Yes | API key for Story Protocol to fetch IP assets |
| `VITE_PUBLIC_STORY_RPC` | ✅ Yes | Story Protocol RPC endpoint |
| `VITE_PUBLIC_SPG_COLLECTION` | ✅ Yes | Story Protocol collection address |
| `VITE_PRIVY_APP_ID` | ✅ Yes | Privy authentication app ID |
| `VITE_GUEST_PRIVATE_KEY` | ✅ Yes | Guest wallet private key |
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for image generation |
| `OPENAI_VERIFIER_MODEL` | ⚠️ Optional | OpenAI model (default: gpt-4o) |
| `PINATA_JWT` | ✅ Yes | Pinata JWT for IPFS uploads |
| `PINATA_GATEWAY` | ✅ Yes | Pinata gateway URL |

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: Variable name (e.g., `STORY_API_KEY`)
   - **Value**: Your actual value
   - **Environments**: Select all (Production, Preview, Development)
4. Click **Save**

Example:
```
STORY_API_KEY = sk_your_actual_key_here
VITE_PUBLIC_STORY_RPC = https://aeneid.storyrpc.io
VITE_PRIVY_APP_ID = your_privy_id_here
```

## Deployment Steps

### 1. Prepare Your Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Deploy to Vercel"

# Push to your main branch
git push origin main
```

### 2. Connect to Vercel

**Option A: Automatic (Recommended)**
- Push to GitHub/GitLab/Bitbucket
- Vercel automatically deploys on push to main branch

**Option B: Manual with Vercel CLI**
```bash
npm install -g vercel
vercel
```

### 3. Set Environment Variables

1. In Vercel dashboard, go to your project
2. Click **Settings** → **Environment Variables**
3. Add all required variables from the table above
4. Save changes

### 4. Trigger Deployment

- If using Git: Push a new commit to main
- If using Vercel CLI: Run `vercel --prod`

### 5. Verify Deployment

1. Check **Deployments** tab in Vercel dashboard
2. Click on the latest deployment
3. Verify the deployment status shows "Ready"
4. Test the application by visiting the provided URL

## Troubleshooting

### Build Fails: "Cannot find module"

**Solution**: Verify all environment variables are set in Vercel settings. The build requires:
- Node version 18+ (automatically selected by Vercel)
- All environment variables from the table above

### API Endpoints Return 500 Error

**Solution**: Check environment variables:
1. Go to **Settings** → **Environment Variables** in Vercel
2. Verify all `STORY_API_KEY` and other API keys are set
3. Redeploy the project (`git push origin main` or `vercel --prod`)

### "Server configuration error: STORY_API_KEY not set"

**Solution**:
- Ensure `STORY_API_KEY` is added in Vercel Environment Variables
- Make sure it's selected for **Production** environment
- Redeploy after setting the variable

### "Failed to fetch IP assets from Story API"

**Possible causes & solutions**:

1. **Invalid API key**
   - Verify the key is correct in Vercel settings
   - Test with a known valid key

2. **Story API is down**
   - Check Story Protocol status: https://api.storyapis.com
   - Wait and retry deployment

3. **Network/Rate limit issues**
   - Check Vercel build logs: `vercel logs <url>`
   - Consider rate limiting from Story API

### "Invalid Ethereum address format"

**Solution**: Ensure wallet address:
- Starts with `0x`
- Followed by 40 hexadecimal characters
- Example: `0x1234567890123456789012345678901234567890`

## Local Development

### Setup

```bash
# Install dependencies
pnpm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Add your API keys to .env
```

### Development Server

```bash
# Start local development server
pnpm dev

# Open http://localhost:8080 in browser
```

### Build for Production

```bash
# Build client only (Vercel's default)
pnpm build

# Or build everything locally
pnpm build:client && pnpm build:server
```

## Build Configuration

- **Build Command**: `npm run build` (builds client only)
- **Output Directory**: `dist/spa`
- **Node Version**: 18+ (automatically selected)

This configuration:
- ✅ Builds React client with Vite
- ✅ Optimizes for production
- ✅ Handles all API routes via Vercel serverless functions
- ✅ Serves static files with proper cache headers

## API Endpoints

All API endpoints are available under `/api/`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/check-ip-assets` | POST | Check IP assets by address |
| `/api/search-ip-assets` | POST | Search IP assets by keyword |
| `/api/search-by-owner` | POST | Get assets owned by address |
| `/api/resolve-ip-name` | POST | Resolve .ip domain name |
| `/api/resolve-owner-domain` | POST | Get domain for owner address |

## Security Notes

### Environment Variables

- **Never** commit `.env` files to Git
- Use Vercel's Environment Variables system for secrets
- API keys should **only** be used server-side (in `/api` routes)

### CORS & CSP

Default security headers are configured:
- Content-Security-Policy protects against XSS
- CORS configured for API endpoints
- Static assets have 1-year cache

### File Upload

- Upload size limit: 8MB (configured in multer)
- Allowed file types: images (jpg, png, webp), videos, audio
- Files validated before processing

## Performance Optimization

### Caching Strategy

- **Static assets** (`/assets/*`): 1 year cache (immutable)
- **HTML/App**: No cache (must revalidate)
- **API responses**: Cache control per endpoint

### Build Optimization

- Client build: Vite with code splitting
- Tree-shaking: Unused code removed
- Minification: Automatic via Vite

## Monitoring & Logs

### View Deployment Logs

```bash
# Using Vercel CLI
vercel logs [deployment-url]

# Or in dashboard:
# Deployments → Click deployment → Logs tab
```

### Common Log Entries

- `BUILD: npm run build` - Build process
- `Deployed successfully` - Deployment complete
- `Error: STORY_API_KEY not found` - Missing environment variable

## Support & Resources

### Story Protocol
- API Documentation: https://api.storyapis.com
- Support: Story Protocol support team

### Vercel
- Documentation: https://vercel.com/docs
- Deployment Guide: https://vercel.com/docs/deployments/overview
- CLI Reference: https://vercel.com/docs/cli

### Privy Authentication
- Docs: https://docs.privy.io
- Support: Privy support team

### OpenAI
- API Reference: https://platform.openai.com/docs
- Status: https://status.openai.com

## FAQ

**Q: How do I update the API keys after deployment?**
A: Edit environment variables in Vercel Settings → Environment Variables, then redeploy.

**Q: Can I use different API keys for Preview vs Production?**
A: Yes, set different values for each environment in Vercel settings.

**Q: How long does deployment take?**
A: Typically 2-5 minutes. Check Deployments tab for status.

**Q: What if the build is stuck?**
A: Cancel the deployment and check the build logs for errors.

**Q: How do I rollback to a previous version?**
A: Go to Deployments → Click previous deployment → Click "Redeploy"
