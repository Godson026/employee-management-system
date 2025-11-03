# Cloudinary Setup Guide

This application uses Cloudinary for storing and serving employee profile pictures.

## Getting Cloudinary Credentials

1. Sign up for a free account at [https://cloudinary.com](https://cloudinary.com)
2. After signing up, go to your Dashboard
3. You'll find your credentials on the dashboard:
   - **Cloud Name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

## Setting Up Environment Variables

Add the following environment variables to your Railway backend deployment:

### For Railway:
1. Go to your Railway project
2. Select your backend service
3. Go to the "Variables" tab
4. Add these three variables:

```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### For Local Development:
Add these to your `backend/.env` file:

```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## How It Works

- When an employee photo is uploaded, it's automatically uploaded to Cloudinary
- The Cloudinary URL (secure HTTPS) is stored in the database
- Old photos are automatically deleted when a new one is uploaded
- All photos are stored in the `employees/` folder in your Cloudinary account

## Benefits

- ✅ Reliable image hosting with global CDN
- ✅ Automatic image optimization and format conversion
- ✅ Secure HTTPS URLs
- ✅ No server storage needed
- ✅ Automatic cleanup of old images

