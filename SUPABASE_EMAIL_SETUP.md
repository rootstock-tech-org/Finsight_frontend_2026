# Supabase Email Configuration Setup

## 🚨 Current Issue
**Error**: "Error sending magic link email" (500 status)
**Cause**: Supabase email provider not configured

## ✅ Quick Fix Steps

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project: `pfbcpqifhbqpymnagzss`
3. Navigate to: **Authentication** → **Settings**

### Step 2: Configure Email Provider

#### Option A: Use Supabase Email (Free, Limited)
1. In Authentication Settings, find **"Email"** section
2. Enable **"Supabase Email"**
3. This provides basic email functionality with limitations

#### Option B: Configure SMTP (Recommended)
1. In Authentication Settings, find **"Email"** section
2. Choose **"Custom SMTP"**
3. Configure with your email provider:
   - **Gmail**: smtp.gmail.com:587
   - **Outlook**: smtp-mail.outlook.com:587
   - **SendGrid**: smtp.sendgrid.net:587
   - **Mailgun**: smtp.mailgun.org:587

### Step 3: Test Configuration
1. Save your email settings
2. Try the forgot password flow again
3. Check your email inbox for the OTP/reset link

## 🔧 Alternative: Use Traditional Password Reset

If email configuration is complex, the app now automatically falls back to traditional password reset when OTP fails.

## 📋 SMTP Configuration Examples

### Gmail SMTP
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: your-app-password
```

### SendGrid SMTP
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: your-sendgrid-api-key
```

## 🚀 After Configuration

1. **Test the flow**: Try forgot password again
2. **Check console**: Look for success messages
3. **Verify emails**: Check your inbox for OTP/reset links

## 📞 Need Help?

If you're still having issues:
1. Check Supabase documentation: https://supabase.com/docs/guides/auth/auth-email
2. Contact Supabase support
3. Use the fallback password reset method (already implemented)
