# How to Seed Your Database on Railway

Your database tables are created but empty. You need to seed them with initial data (roles, admin users, etc.).

## Option 1: Run Seed Script via Railway Console (Recommended)

### Step 1: Access Railway Console

1. Go to your Railway dashboard
2. Click on your **`employee-management-system`** service (the backend)
3. Click on the **"Deployments"** tab
4. Click on the most recent deployment
5. Look for a **"Console"** or **"Shell"** button, OR
6. Go to **"Settings"** → Look for **"Connect"** or **"Shell"** option

### Step 2: Run the Seed Command

Once you're in the console/shell, run:

```bash
cd /app
npm run seed
```

This will:
- Create all roles (System Admin, HR Manager, Branch Manager, etc.)
- Create an Administration department
- Create admin user: `admin@example.com` / password: `password123`
- Create HR Manager user: `hr@example.com` / password: `password123`

---

## Option 2: Add Seed as One-Time Task (Alternative)

If Railway doesn't have a console, you can temporarily modify the start command:

1. Go to Railway → Your backend service → **"Settings"** tab
2. Find **"Deploy"** section
3. Temporarily change **Start Command** to:
   ```
   npm run seed && npm run start:prod
   ```
4. Save and redeploy
5. After seeding completes (check logs), change Start Command back to:
   ```
   npm run start:prod
   ```
6. Redeploy again

**⚠️ Note:** This runs the seed every time the container starts, so only use temporarily!

---

## Option 3: Run Locally (If Railway Console Not Available)

If Railway doesn't have a console, you can run the seed locally but connect to Railway's database:

### Step 1: Get Railway Database Connection String

1. In Railway, go to your **Postgres** service
2. Click **"Variables"** tab
3. Copy the **`DATABASE_URL`** or get individual connection details

### Step 2: Run Locally

1. In your local `backend` folder, create/update `.env`:
   ```env
   DATABASE_URL=your-railway-database-url-here
   NODE_ENV=production
   ```

2. Run:
   ```bash
   cd backend
   npm install
   npm run seed
   ```

---

## After Seeding

Once seeded, you should have:

✅ **Roles**: System Admin, HR Manager, Branch Manager, Department Head, Employee, Auditor

✅ **Department**: Administration

✅ **Users**:
- Admin: `admin@example.com` / `password123`
- HR Manager: `hr@example.com` / `password123`

---

## Verify Seeding

1. Go to Railway → Postgres service → Database tab
2. Check the `roles` table - should have 6 roles
3. Check the `users` table - should have 2 users
4. Check the `departments` table - should have 1 department

---

## Important: Change Passwords After First Login!

**⚠️ SECURITY**: The default passwords are `password123` - change them immediately after first login!

---

**Which method would you like to use?** Option 1 (Console) is the cleanest if available.

