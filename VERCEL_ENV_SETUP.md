# Vercel Environment Variables Setup

## Required Environment Variables

For the app to work in production (Vercel), you need to add these environment variables in your Vercel project settings:

1. **VITE_SUPABASE_URL** - Your Supabase project URL
2. **VITE_SUPABASE_ANON_KEY** - Your Supabase anonymous/public key

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings**
3. Click on **Environment Variables** in the left sidebar
4. Add each variable:
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**
5. Repeat for `VITE_SUPABASE_ANON_KEY`

## After Adding Variables

1. **Redeploy** your application in Vercel
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**

OR

2. Push a new commit to trigger a new deployment

## Verify Variables Are Set

After redeploying, check the browser console. You should see:
- `Supabase URL: https://xxxxx.supabase.co`
- `Supabase Anon Key: xxxxx...`

If you see "Missing" instead, the variables are not set correctly.

## Important Notes

- Environment variables prefixed with `VITE_` are exposed to the client-side code
- These are safe to expose as they are public keys (anon key)
- Never commit your `.env` file to git
- Make sure to add the variables for all environments (Production, Preview, Development)

