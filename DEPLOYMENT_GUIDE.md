# Employee Management System - Deployment Guide

This guide covers how to host and deploy your Employee Management System to production.

## 🚀 Hosting Options

### **Recommended Hosting Platforms:**

1. **Vercel** (Frontend) + **Railway/Render** (Backend + Database) - Easiest
2. **DigitalOcean App Platform** - Full-stack solution
3. **AWS (EC2/Elastic Beanstalk)** - More control, higher complexity
4. **Heroku** - Simple but may have cost limits
5. **VPS (DigitalOcean/Linode)** - Full control, requires more setup

---

## 📋 Pre-Deployment Checklist

- [ ] Update CORS settings for production domain
- [ ] Set up production environment variables
- [ ] Configure production database
- [ ] Build frontend for production
- [ ] Configure SMTP for emails
- [ ] Set up file uploads directory
- [ ] Test production build locally

---

## 🔧 Step 1: Prepare Backend for Production

### 1.1 Update CORS Configuration

The `main.ts` file needs to accept your production frontend URL. We'll create an environment-based CORS configuration.

### 1.2 Create Production Environment File

Create `.env.production` in the backend folder:

```env
# Database
DB_HOST=your-database-host
DB_PORT=5432
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_DATABASE=ems_db

# Server
PORT=3000
NODE_ENV=production

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com

# SMTP Configuration (for emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false
SMTP_FROM=noreply@yourcompany.com
```

### 1.3 Update main.ts for Production CORS

The CORS configuration will be updated to use environment variables.

---

## 🌐 Step 2: Prepare Frontend for Production

### 2.1 Create Production Environment File

Create `.env.production` in the frontend folder:

```env
VITE_API_URL=https://your-backend-api.com
```

### 2.2 Build Frontend

```bash
cd frontend
npm run build
```

This creates a `dist` folder with production-ready files.

---

## 📦 Option 1: Deploy to Railway (Recommended for Beginners)

### Backend Deployment:

1. **Sign up** at [railway.app](https://railway.app)

2. **Create New Project** → "Deploy from GitHub repo"

3. **Add PostgreSQL Database**:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will provide connection details

4. **Deploy Backend**:
   - Add service → "GitHub Repo" → Select your repo → Choose `backend` folder
   - Set root directory to `backend`
   - Add environment variables (see backend `.env.production` above)
   - Set start command: `npm run start:prod`
   - Railway will auto-deploy

5. **Get Backend URL**: Railway provides a URL like `https://your-app.up.railway.app`

### Frontend Deployment (Vercel):

1. **Sign up** at [vercel.com](https://vercel.com)

2. **Import Project** → Connect GitHub repo

3. **Configure**:
   - Root Directory: `frontend`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables:
     - `VITE_API_URL`: Your Railway backend URL

4. **Deploy**: Vercel auto-deploys

---

## 📦 Option 2: Deploy to Render

### Backend Deployment:

1. **Sign up** at [render.com](https://render.com)

2. **Create Web Service**:
   - Connect GitHub repo
   - Root Directory: `backend`
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Add PostgreSQL database (free tier available)

3. **Set Environment Variables** (from `.env.production`)

### Frontend Deployment (Render):

1. **Create Static Site**:
   - Connect GitHub repo
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **Set Environment Variables**:
   - `VITE_API_URL`: Your backend Render URL

---

## 📦 Option 3: Deploy to DigitalOcean App Platform

1. **Sign up** at [digitalocean.com](https://digitalocean.com)

2. **Create App** → Connect GitHub

3. **Add Backend Component**:
   - Source: `backend` folder
   - Build Command: `npm install && npm run build`
   - Run Command: `npm run start:prod`
   - Add PostgreSQL database

4. **Add Frontend Component**:
   - Source: `frontend` folder
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
   - Add environment variable: `VITE_API_URL`

---

## 📦 Option 4: Deploy to VPS (Ubuntu Server)

### Prerequisites:
- Ubuntu 20.04+ server
- Domain name (optional but recommended)
- SSH access

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

### Step 2: Setup PostgreSQL

```bash
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE ems_db;
CREATE USER ems_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE ems_db TO ems_user;
\q
```

### Step 3: Deploy Backend

```bash
# Clone your repository
git clone your-repo-url
cd employee-management-system/backend

# Install dependencies
npm install

# Build
npm run build

# Create .env file
nano .env
# Paste your production environment variables

# Start with PM2
pm2 start dist/main.js --name ems-backend
pm2 save
pm2 startup
```

### Step 4: Deploy Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Build
npm run build

# The dist folder contains production files
```

### Step 5: Configure Nginx

Create `/etc/nginx/sites-available/ems`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /path/to/employee-management-system/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ems /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔒 Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set `synchronize: false` in production (use migrations)
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Regular backups of database
- [ ] Keep dependencies updated
- [ ] Set up monitoring/logging

---

## 📝 Important Notes

### Database Synchronization
⚠️ **IMPORTANT**: In production, set `synchronize: false` in `app.module.ts` and use migrations instead:

```typescript
synchronize: configService.get<string>('NODE_ENV') !== 'production',
```

### File Uploads
Make sure the `uploads` directory exists on your server and has write permissions:

```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```

### Environment Variables
Never commit `.env` files to Git. Use your hosting platform's environment variable settings.

---

## 🧪 Testing Production Build Locally

### Test Backend:
```bash
cd backend
npm run build
npm run start:prod
```

### Test Frontend:
```bash
cd frontend
npm run build
npm run preview
```

---

## 📞 Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` in backend matches your frontend domain
- Check CORS whitelist in `main.ts`

### Database Connection Issues
- Verify database credentials
- Check if database is accessible from your hosting platform
- Some platforms require SSL for database connections

### Build Failures
- Check Node.js version (requires Node 18+)
- Clear `node_modules` and reinstall
- Check for TypeScript errors

---

## 🔄 Continuous Deployment

Most platforms (Railway, Render, Vercel) support automatic deployments:
- Push to `main` branch → Auto-deploy
- Set up branch protection rules
- Use pull requests for staging environment

---

## 📊 Monitoring & Logs

### Backend Logs (PM2):
```bash
pm2 logs ems-backend
pm2 monit
```

### Nginx Logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

**Need Help?** Check the platform-specific documentation or reach out for support.

