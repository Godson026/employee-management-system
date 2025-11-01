# Environment Variables Setup

## Backend Environment Variables

Create a `.env` file in the `backend` folder with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DATABASE=ems_db

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Frontend URL (comma-separated for multiple origins)
# For production, use: https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=http://localhost:5173

# SMTP Configuration (for password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false
SMTP_FROM=noreply@yourcompany.com
```

## Frontend Environment Variables

Create a `.env` file in the `frontend` folder with the following:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000
```

For production, update to:
```env
VITE_API_URL=https://your-backend-api.com
```

## Production Environment Variables

### Backend Production (.env or hosting platform settings):
```env
NODE_ENV=production
DB_HOST=your-production-db-host
DB_USERNAME=your-production-db-user
DB_PASSWORD=your-production-db-password
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=strong-random-secret-key-here
# ... other production values
```

### Frontend Production:
```env
VITE_API_URL=https://your-backend-api.com
```

## Important Notes

1. **Never commit `.env` files to Git** - They contain sensitive information
2. **Generate strong JWT_SECRET** - Use a random string generator for production
3. **Use different credentials** for development and production databases
4. **Set FRONTEND_URL** to your actual production domain for CORS

