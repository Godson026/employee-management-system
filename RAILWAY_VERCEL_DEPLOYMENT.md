# Railway (Backend) + Vercel (Frontend) Deployment Guide

Complete step-by-step guide to deploy your Employee Management System.

---

## 📋 Prerequisites

- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Your code pushed to a GitHub repository

---

## 🚂 Part 1: Deploy Backend to Railway

### Step 1: Sign Up and Create Project

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select your `employee-management-system` repository
6. Railway will create a new project

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"New"** button (or **"+"** icon)
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will create a PostgreSQL database
4. **IMPORTANT**: Click on the PostgreSQL service
5. Go to the **"Variables"** tab
6. Note down the connection details:
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`
   - There's also a `DATABASE_URL` connection string (recommended to use)

### Step 3: Configure Backend Service

1. Click **"New"** → **"GitHub Repo"** (if not already done)
2. Select your repository
3. Railway will detect it's a Node.js project
4. Click on the newly created service
5. Go to **"Settings"** tab
6. Set the **Root Directory** to: `backend`
7. Go to **"Deploy"** tab
8. Set the **Start Command** to: `npm run start:prod`

### Step 4: Set Environment Variables

1. In your backend service, go to **"Variables"** tab
2. Click **"New Variable"** and add each of these:

```env
# Database - Use the DATABASE_URL from PostgreSQL service
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Or set individually (if Railway doesn't provide DATABASE_URL):
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_DATABASE=${{Postgres.PGDATABASE}}

# Server
PORT=3000
NODE_ENV=production

# JWT - IMPORTANT: Generate a strong secret (use a password generator)
JWT_SECRET=your-super-strong-random-secret-key-change-this
JWT_EXPIRES_IN=24h

# Frontend URL - Update after deploying frontend
FRONTEND_URL=https://your-vercel-app.vercel.app

# SMTP Configuration (for password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_SECURE=false
SMTP_FROM=noreply@siclife.com
```

**Note**: Railway can reference variables from other services using `${{ServiceName.VariableName}}`

### Step 5: Generate Production Build

1. Railway should automatically detect and build your project
2. If build fails, check the logs
3. Ensure `npm run build` completes successfully
4. Railway will automatically run `npm run start:prod` after build

### Step 6: Get Your Backend URL

1. After deployment succeeds, go to **"Settings"** tab
2. Under **"Networking"**, you'll see a **"Generate Domain"** button
3. Click it to get a public URL like: `https://your-app-name.up.railway.app`
4. **Copy this URL** - you'll need it for the frontend
5. (Optional) You can add a custom domain later

### Step 7: Update CORS (After Frontend Deployment)

1. Once you have your Vercel frontend URL, update `FRONTEND_URL` in Railway variables
2. You can also add multiple URLs separated by commas:
   ```
   FRONTEND_URL=https://your-app.vercel.app,https://www.your-custom-domain.com
   ```

---

## ▲ Part 2: Deploy Frontend to Vercel

### Step 1: Sign Up and Import Project

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New"** → **"Project"**
3. Click **"Import Git Repository"**
4. Authorize Vercel to access your GitHub (if needed)
5. Select your `employee-management-system` repository
6. Click **"Import"**

### Step 2: Configure Build Settings

Vercel should auto-detect Vite, but verify these settings:

1. **Framework Preset**: `Vite`
2. **Root Directory**: Click **"Edit"** → Set to: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### Step 3: Set Environment Variables

1. In the project settings, scroll to **"Environment Variables"**
2. Click **"Add New"**
3. Add this variable:

```
Key: VITE_API_URL
Value: https://your-railway-backend.up.railway.app
```

**Important**: Replace `your-railway-backend.up.railway.app` with your actual Railway backend URL from Step 6 above.

### Step 4: Deploy

1. Click **"Deploy"** button
2. Vercel will:
   - Install dependencies
   - Build your frontend
   - Deploy to a production URL
3. Wait for deployment to complete (usually 1-2 minutes)

### Step 5: Get Your Frontend URL

1. After deployment, Vercel will show you a URL like: `https://your-app-name.vercel.app`
2. **Copy this URL**
3. Go back to Railway and update `FRONTEND_URL` with this Vercel URL

---

## 🔄 Part 3: Connect Frontend and Backend

### Step 1: Update Backend CORS

1. Go back to Railway → Your backend service → Variables
2. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://your-app-name.vercel.app
   ```
3. Railway will automatically redeploy with new environment variables

### Step 2: Test the Connection

1. Visit your Vercel frontend URL
2. Try to log in
3. Check browser console for any CORS errors
4. If you see CORS errors, verify:
   - `FRONTEND_URL` in Railway matches exactly (including https://)
   - Railway service has redeployed after variable change

---

## 🔧 Part 4: Additional Configuration

### Set Up File Uploads

1. Railway uses ephemeral storage (files are deleted on restart)
2. For file uploads, consider:
   - Using Railway's **Volume** service (persistent storage)
   - Or using cloud storage (AWS S3, Cloudinary, etc.)

To add Volume storage:
1. In Railway project, click **"New"** → **"Volume"**
2. Name it `uploads`
3. In your backend service Variables, you don't need to change anything - the uploads folder will persist

### Database Migrations

Your database will auto-sync in development, but for production:
- Make sure `synchronize: false` in production (already configured)
- For schema changes, use TypeORM migrations

### Enable HTTPS (Automatic)

- ✅ Railway provides HTTPS automatically
- ✅ Vercel provides HTTPS automatically
- Both platforms handle SSL certificates automatically

---

## 🔍 Part 5: Monitoring and Debugging

### Railway Logs

1. Go to your backend service in Railway
2. Click **"Deployments"** tab
3. Click on a deployment to see logs
4. Use the **"View Logs"** button for real-time logs

### Vercel Logs

1. Go to your project in Vercel
2. Click on a deployment
3. View build logs and runtime logs

### Common Issues

**Issue: CORS Errors**
- Solution: Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Include `https://` in the URL
- Redeploy backend after changing environment variables

**Issue: Database Connection Failed**
- Solution: Check database variables are correctly set
- Verify PostgreSQL service is running in Railway
- Check if `DATABASE_URL` is set correctly

**Issue: Build Fails**
- Solution: Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Railway auto-detects, but you can set it)

**Issue: Environment Variables Not Working**
- Solution: Variables starting with `VITE_` are only available in frontend
- Backend variables don't need `VITE_` prefix
- Redeploy after adding/changing variables

---

## 📝 Part 6: Custom Domains (Optional)

### Railway Custom Domain

1. Go to Railway → Your backend service → Settings
2. Under **"Networking"**, click **"Custom Domain"**
3. Add your domain and follow DNS instructions

### Vercel Custom Domain

1. Go to Vercel → Your project → Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions
4. Update `FRONTEND_URL` in Railway with your custom domain

---

## 🎉 You're Done!

Your Employee Management System should now be live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.up.railway.app`

### Next Steps:

1. ✅ Test all functionality
2. ✅ Set up database backups (Railway offers automatic backups on paid plans)
3. ✅ Configure email settings (SMTP) for password resets
4. ✅ Set up monitoring/alerts
5. ✅ Consider setting up staging environment

---

## 🔒 Security Checklist

- [ ] Changed `JWT_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Database password is strong and secure
- [ ] CORS is configured correctly
- [ ] HTTPS is enabled (automatic on both platforms)
- [ ] Environment variables are set (not hardcoded)
- [ ] File uploads are secured (if implemented)
- [ ] Regular backups are configured

---

## 💰 Pricing Notes

### Railway:
- **Free Tier**: $5 credit/month (usually enough for small apps)
- **Hobby Plan**: $5/month (if you exceed free tier)
- Database: Included in free tier

### Vercel:
- **Free Tier**: Unlimited for personal projects
- **Pro Plan**: $20/month (for team/enterprise features)
- **Bandwidth**: Generous free tier

Both platforms offer free tiers that are perfect for getting started!

---

## 📞 Troubleshooting

### Can't connect to backend?
- Check Railway service is running (status should be "Active")
- Verify backend URL is correct in frontend `.env`
- Check Railway logs for errors

### Frontend shows blank page?
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Check Vercel deployment logs

### Database not working?
- Verify PostgreSQL service is running in Railway
- Check database connection variables
- Look at backend logs for connection errors

---

**Need Help?** Check Railway and Vercel documentation or their Discord communities!

