# Database Setup Guide

## Which SQL File Should You Run?

### Option 1: Supabase (Recommended - Cloud PostgreSQL)
**File:** `supabase_schema.sql`

**Use this if:**
- ✅ You're using Supabase (cloud database)
- ✅ You want a free, hosted PostgreSQL database
- ✅ You want built-in authentication and storage
- ✅ You want Row Level Security (RLS) features

**How to run:**
1. Go to your Supabase project: https://app.supabase.com/
2. Click **"SQL Editor"** (left sidebar)
3. Click **"New Query"**
4. Copy and paste the entire `supabase_schema.sql` file
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for all tables to be created

---

### Option 2: MySQL (Traditional Database)
**File:** `database_schema.sql`

**Use this if:**
- ✅ You have your own MySQL/MariaDB server
- ✅ You're using a traditional hosting provider
- ✅ You prefer MySQL over PostgreSQL

**How to run:**
1. Connect to your MySQL database (phpMyAdmin, MySQL Workbench, or command line)
2. Select your database
3. Copy and paste the entire `database_schema.sql` file
4. Execute the SQL script
5. Verify tables are created

---

## Quick Comparison

| Feature | Supabase Schema | MySQL Schema |
|---------|----------------|--------------|
| Database Type | PostgreSQL | MySQL |
| ID Type | UUID | AUTO_INCREMENT INT |
| Timestamps | TIMESTAMPTZ | TIMESTAMP |
| Row Level Security | ✅ Yes | ❌ No |
| Cloud Hosted | ✅ Yes (Free tier) | ❌ Self-hosted |
| Authentication | ✅ Built-in | ❌ Manual setup |

---

## Recommended: Supabase Setup

### Step 1: Create Supabase Account
1. Go to: https://supabase.com/
2. Click **"Start your project"**
3. Sign up with GitHub (or email)
4. Create a new project

### Step 2: Get Your Supabase Credentials
1. In your Supabase project dashboard
2. Click **"Settings"** (gear icon)
3. Click **"API"**
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (for frontend)
   - **service_role key** (for backend - keep secret!)

### Step 3: Run the SQL Schema
1. In Supabase dashboard, click **"SQL Editor"**
2. Click **"New Query"**
3. Open `supabase_schema.sql` from your project
4. Copy the entire file content
5. Paste into the SQL Editor
6. Click **"Run"** (or Ctrl+Enter)
7. You should see: "Success. No rows returned"

### Step 4: Verify Tables Created
1. Click **"Table Editor"** (left sidebar)
2. You should see these tables:
   - ✅ `competitions`
   - ✅ `user_entries`
   - ✅ `spin_results`
   - ✅ `winners`
   - ✅ `admin_logs`
   - ✅ `admin_settings`

### Step 5: Set Up Row Level Security (RLS)
The schema includes RLS examples. You may need to:
1. Go to **"Authentication"** → **"Policies"**
2. Set up policies for each table
3. Or disable RLS for testing (not recommended for production)

---

## MySQL Setup (Alternative)

### Step 1: Create Database
```sql
CREATE DATABASE prize_wheel_db;
USE prize_wheel_db;
```

### Step 2: Run Schema
1. Open `database_schema.sql`
2. Copy entire content
3. Run in your MySQL client
4. Verify tables created

### Step 3: Verify
```sql
SHOW TABLES;
```
Should show:
- `prizes`
- `user_entries`
- `spin_results`
- `winners`
- `admin_logs`
- `admin_settings`

---

## Which One Should You Choose?

### Choose Supabase if:
- ✅ You want a free, cloud-hosted database
- ✅ You want easy setup (no server management)
- ✅ You want built-in authentication
- ✅ You want automatic backups
- ✅ You're building a modern web app

### Choose MySQL if:
- ✅ You already have a MySQL server
- ✅ You prefer traditional hosting
- ✅ You have specific MySQL requirements
- ✅ You want full control over the database

---

## Next Steps After Running Schema

### 1. Update Your Code
You'll need to connect your app to the database:

**For Supabase:**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

**For MySQL:**
- Set up a backend API (Node.js, PHP, etc.)
- Connect to MySQL database
- Create API endpoints for your app

### 2. Test Database Connection
- Try inserting a test record
- Verify data is saved
- Check if you can read it back

### 3. Update Payment Saving Code
In `main.js`, uncomment the database saving code in the `onApprove` handler.

---

## Troubleshooting

**Problem:** "Extension uuid-ossp does not exist"
- **Solution:** This is normal in Supabase - it's already enabled. You can remove that line or ignore the error.

**Problem:** "Table already exists"
- **Solution:** The schema uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

**Problem:** "Permission denied"
- **Solution:** Check your database user permissions. For Supabase, make sure you're using the correct API keys.

**Problem:** "Syntax error"
- **Solution:** Make sure you're using the correct schema file for your database type (Supabase vs MySQL).

---

## Summary

**For Most Users:**
1. ✅ Use **Supabase** (easier, free, cloud-hosted)
2. ✅ Run **`supabase_schema.sql`**
3. ✅ Follow Supabase setup steps above

**For Advanced Users:**
1. ✅ Use **MySQL** if you have your own server
2. ✅ Run **`database_schema.sql`**
3. ✅ Set up your own backend API


