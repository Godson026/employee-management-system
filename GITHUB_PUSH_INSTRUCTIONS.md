# Push to GitHub - Step by Step

Your code is committed locally! Now let's push it to GitHub.

## Option 1: Using GitHub Website (Easiest)

### Step 1: Create Repository on GitHub

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository details:
   - **Name**: `employee-management-system` (or any name you prefer)
   - **Description**: "Employee Management System - NestJS + React"
   - **Visibility**: Choose **Private** (recommended) or **Public**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

### Step 2: Copy Repository URL

After creating, GitHub will show you a page with commands. Copy the repository URL:
- HTTPS: `https://github.com/yourusername/employee-management-system.git`
- Or SSH: `git@github.com:yourusername/employee-management-system.git`

### Step 3: Push from Command Line

Run these commands in your terminal (replace with your actual URL):

```bash
git remote add origin https://github.com/yourusername/employee-management-system.git
git branch -M main
git push -u origin main
```

If asked for credentials:
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your GitHub password)
  - How to create: GitHub → Settings → Developer settings → Personal access tokens → Generate new token
  - Select scope: `repo` (full control)

---

## Option 2: Using GitHub CLI (If Installed)

```bash
gh repo create employee-management-system --private --source=. --remote=origin --push
```

---

## After Pushing

Once pushed, you can:
1. ✅ View your code on GitHub
2. ✅ Connect to Railway for backend deployment
3. ✅ Connect to Vercel for frontend deployment

Both Railway and Vercel can automatically deploy from your GitHub repository!

---

## Troubleshooting

**Error: "remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/yourusername/your-repo.git
```

**Error: "Authentication failed"**
- Use Personal Access Token instead of password
- Or set up SSH keys for GitHub

**Error: "Failed to push some refs"**
- Make sure you created the repo without initializing files
- Or pull first: `git pull origin main --allow-unrelated-histories`

---

## Next Steps After Pushing

1. Follow `RAILWAY_VERCEL_DEPLOYMENT.md` to deploy
2. Or use `QUICK_START_DEPLOYMENT.md` for quick deployment

