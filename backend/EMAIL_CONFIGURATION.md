# Email Configuration Guide

This guide explains how to configure SMTP email settings for the password reset functionality.

## Setup Instructions

1. **Create or update `.env` file** in the `backend` directory with the following variables:

```env
# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:5173

# Email/SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
SMTP_FROM=noreply@siclife.com
```

## Gmail Setup

To use Gmail as your SMTP provider:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to your Google Account settings
   - Navigate to Security → 2-Step Verification
   - Under "App passwords", generate a new app password
   - Copy the 16-character password
3. **Configure `.env`**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   SMTP_FROM=your-email@gmail.com
   ```

## Other SMTP Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourdomain.com
```

## Development Mode

If SMTP is not configured, the email service will:
- Log email details to the console
- Display reset links in the backend logs
- Continue to function for testing purposes

This is useful during development when you don't have SMTP credentials set up yet.

## Testing

After configuring SMTP:
1. Restart the backend server
2. Request a password reset from the frontend
3. Check the backend logs for "SMTP transporter configured and verified successfully"
4. Check your email inbox for the password reset link

## Troubleshooting

### Connection Errors
- Verify your SMTP credentials are correct
- Check that your firewall allows connections to the SMTP port
- For Gmail, ensure you're using an App Password, not your regular password
- Try using `SMTP_SECURE=true` for port 465

### Email Not Received
- Check spam/junk folder
- Verify the `SMTP_FROM` address is valid
- Check backend logs for error messages
- Ensure the SMTP server allows emails from your application

## Security Notes

- **Never commit `.env` file to version control**
- Use strong passwords/app passwords
- Consider using environment-specific configurations
- For production, use a dedicated email service (SendGrid, AWS SES, etc.)

