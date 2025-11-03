# Cloudinary Troubleshooting Guide

## "Invalid Signature" Error (HTTP 401)

If you're seeing an "Invalid Signature" error when uploading photos, it means your Cloudinary credentials are incorrect or there's an issue with how they're configured.

### Common Causes:

1. **Incorrect API Secret** - The most common cause. Double-check that you copied the entire API Secret without any extra spaces or characters.

2. **Incorrect API Key** - Make sure the API Key matches exactly what's shown in your Cloudinary dashboard.

3. **Incorrect Cloud Name** - Verify the Cloud Name is correct (no spaces, no special characters).

4. **Extra Spaces** - Environment variables might have leading/trailing spaces. The code now trims them automatically.

### How to Fix:

#### Step 1: Verify Your Cloudinary Credentials

1. Go to [https://cloudinary.com/console](https://cloudinary.com/console)
2. Log in to your account
3. Go to your Dashboard
4. Verify these values match exactly what you have in Railway:
   - **Cloud Name** (e.g., `dxy123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

#### Step 2: Update Railway Environment Variables

1. Go to your Railway project
2. Select your backend service
3. Go to the "Variables" tab
4. For each Cloudinary variable:
   - Click "Edit" on the variable
   - **Copy and paste the value fresh from Cloudinary** (don't retype it)
   - Make sure there are no spaces before or after
   - Save

5. The variables should be:
   ```
   CLOUDINARY_CLOUD_NAME=your-exact-cloud-name
   CLOUDINARY_API_KEY=your-exact-api-key
   CLOUDINARY_API_SECRET=your-exact-api-secret
   ```

#### Step 3: Verify in Railway Logs

After Railway redeploys, check the logs for:
- ✅ `Cloudinary configured successfully` - This means credentials are correct
- ❌ `Invalid Signature` - Credentials are still incorrect

### Testing Your Credentials Locally

You can test if your credentials work by creating a simple test script:

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'YOUR_CLOUD_NAME',
  api_key: 'YOUR_API_KEY',
  api_secret: 'YOUR_API_SECRET',
});

cloudinary.uploader.upload('https://example.com/test.jpg', 
  { folder: 'test' }, 
  (error, result) => {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success!', result.secure_url);
    }
  }
);
```

If this works, your credentials are correct. If you get an "Invalid Signature" error, double-check your API Secret.

### Important Notes:

- **API Secret is sensitive** - Never share it publicly or commit it to git
- **Copy, don't type** - Always copy credentials from Cloudinary dashboard to avoid typos
- **No spaces** - Make sure environment variables don't have spaces
- **Redeploy required** - After changing environment variables, Railway will automatically redeploy

