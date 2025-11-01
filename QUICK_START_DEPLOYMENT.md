# 🚀 Quick Start: Railway + Vercel Deployment

**TL;DR Version** - Get your app deployed in 15 minutes!

---

## ⚡ Quick Steps

### 1️⃣ Prepare Your Code
- ✅ Push your code to GitHub
- ✅ Make sure you have a GitHub repository

### 2️⃣ Deploy Backend to Railway (5 minutes)

1. Go to [railway.app](https://railway.app) → Sign up/Login
2. **New Project** → **Deploy from GitHub repo** → Select your repo
3. Click **"New"** → **"Database"** → **"PostgreSQL"**
4. Click **"New"** → **"GitHub Repo"** → Select your repo again
5. Click on the service → **Settings**:
   - **Root Directory**: `backend`
6. **Variables** tab → Add these:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=3000
JWT_SECRET=your-strong-random-secret-key-here
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-vercel-url.vercel.app
```

7. **Settings** → **Generate Domain** → Copy the URL (e.g., `https://your-app.up.railway.app`)

### 3️⃣ Deploy Frontend to Vercel (5 minutes)

1. Go to [vercel.com](https://vercel.com) → Sign up/Login
2. **Add New** → **Project** → Import your GitHub repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
4. **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: Your Railway backend URL from step 2
5. Click **Deploy**
6. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)

### 4️⃣ Connect Them (2 minutes)

1. Go back to Railway → Your backend service → **Variables**
2. Update `FRONTEND_URL` with your Vercel URL
3. Railway will auto-redeploy

### 5️⃣ Test! (3 minutes)

1. Visit your Vercel URL
2. Try logging in
3. Check if everything works

---

## 📝 Required Environment Variables

### Railway (Backend):
```
DATABASE_URL=${{Postgres.DATABASE_URL}}  ← Automatic from Railway PostgreSQL
NODE_ENV=production
PORT=3000
JWT_SECRET=generate-strong-random-string
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-vercel-url.vercel.app  ← Update after Vercel deploy
SMTP_HOST=smtp.gmail.com  ← Optional (for password reset)
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcompany.com
```

### Vercel (Frontend):
```
VITE_API_URL=https://your-railway-backend.up.railway.app
```

---

## 🔧 Important Notes

1. **JWT_SECRET**: Generate a strong random string (use a password generator)
2. **FRONTEND_URL**: Update this in Railway AFTER deploying to Vercel
3. **DATABASE_URL**: Railway automatically provides this via `${{Postgres.DATABASE_URL}}`
4. **Build Commands**: Railway and Vercel auto-detect, but you can customize if needed

---

## ❓ Troubleshooting

**CORS Error?**
- Make sure `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Include `https://` prefix
- Wait for Railway to redeploy after changing variables

**Database Connection Failed?**
- Check Railway PostgreSQL service is running
- Verify `DATABASE_URL` is set correctly
- Look at Railway logs for specific errors

**Frontend Can't Connect to Backend?**
- Verify `VITE_API_URL` is set correctly in Vercel
- Check browser console for errors
- Ensure backend is deployed and running

---

## ✅ Done!

Your app should now be live! 

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.up.railway.app`

For detailed instructions, see `RAILWAY_VERCEL_DEPLOYMENT.md`

