# How to Get Your PayPal Client ID

## Step-by-Step Guide

### Step 1: Go to PayPal Developer Dashboard
1. Open your browser
2. Go to: **https://developer.paypal.com/**
3. Click **"Log In"** (top right)

### Step 2: Log In or Sign Up
- **If you have a PayPal account:** Log in with your PayPal email and password
- **If you don't have a PayPal account:** 
  - Click "Sign Up"
  - Create a PayPal business account
  - Complete the verification process

### Step 3: Navigate to Apps & Credentials
1. Once logged in, you'll see the **Dashboard**
2. In the left sidebar, click **"My Apps & Credentials"**
3. You'll see two sections:
   - **Sandbox** (for testing)
   - **Live** (for production)

### Step 4: Get Sandbox Client ID (For Testing)
1. Under **"Sandbox"** section, click **"Create App"** (if you don't have one)
2. Or click on an existing app
3. You'll see:
   - **Client ID** (this is what you need!)
   - **Secret** (keep this secret, don't share it)
4. **Copy the Client ID**

### Step 5: Get Live Client ID (For Production)
1. Under **"Live"** section, click **"Create App"** (if you don't have one)
2. Or click on an existing app
3. **Copy the Client ID** (different from sandbox)

### Step 6: Update Your Code
1. Open `index.html` in your project
2. Find line 114 (the PayPal script tag)
3. Replace `AcOhAoDv1YGtO6KG9VUwBkdNmqpTI9VUVVzkzWTpCP2GVu17nrsElPtuxQm-WK4j6xMFOsILJkH1W3Am` with your **Sandbox Client ID**
4. Save the file

## Visual Guide

```
PayPal Developer Dashboard
├── Dashboard (Home)
├── My Apps & Credentials ← Click here
│   ├── Sandbox
│   │   ├── Create App
│   │   └── Your App Name
│   │       ├── Client ID: [COPY THIS] ← This is what you need!
│   │       └── Secret: [Keep secret]
│   └── Live
│       ├── Create App
│       └── Your App Name
│           ├── Client ID: [COPY THIS] ← For production
│           └── Secret: [Keep secret]
```

## Current Client ID in Your Code

Your current Client ID is:
```
AcOhAoDv1YGtO6KG9VUwBkdNmqpTI9VUVVzkzWTpCP2GVu17nrsElPtuxQm-WK4j6xMFOsILJkH1W3Am
```

**Question:** Is this YOUR Client ID from PayPal Developer Dashboard?
- ✅ **Yes** → You're all set! Just make sure it's the Sandbox Client ID for testing
- ❌ **No** → Follow the steps above to get your own Client ID

## Important Notes

1. **Sandbox vs Live:**
   - **Sandbox Client ID** = For testing (no real money)
   - **Live Client ID** = For production (real money)

2. **Client ID vs Secret:**
   - **Client ID** = Safe to put in frontend code (what you need)
   - **Secret** = NEVER put in frontend code! Only use on backend

3. **Testing:**
   - Use Sandbox Client ID for testing
   - Create sandbox test accounts in PayPal Dashboard
   - Test payments won't use real money

## Troubleshooting

**Problem:** "I can't find My Apps & Credentials"
- **Solution:** Make sure you're logged in and on the Dashboard page

**Problem:** "I don't see Create App button"
- **Solution:** You might need to verify your PayPal account first

**Problem:** "The Client ID doesn't work"
- **Solution:** 
  - Make sure you copied the entire Client ID (it's long!)
  - Check if you're using Sandbox ID for sandbox testing
  - Verify the app is active in PayPal Dashboard

## Quick Checklist

- [ ] Logged into PayPal Developer Dashboard
- [ ] Navigated to "My Apps & Credentials"
- [ ] Created or found your Sandbox app
- [ ] Copied the Sandbox Client ID
- [ ] Updated `index.html` with your Client ID
- [ ] Tested payment with sandbox account

## Need Help?

If you're still having trouble:
1. Check PayPal Developer Documentation: https://developer.paypal.com/docs/
2. PayPal Support: https://www.paypal.com/support
3. Make sure your PayPal account is verified


