# Supabase OTP 500 Error Troubleshooting Guide

## 🚨 Current Issue
Getting `500 (Internal Server Error)` when trying to send OTP via `supabase.auth.signInWithOtp()`

## 🔍 Debugging Steps

### 1. Check Console Logs
Open browser console and look for these logs:
- `🔐 Attempting to send OTP to: [email]`
- `🔧 Supabase client URL: [url]`
- `❌ OTP Error Details: [error object]`

### 2. Common Causes & Solutions

#### A. Email Provider Not Configured
**Problem**: Supabase doesn't have an email provider set up
**Solution**: 
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project → Authentication → Settings
3. Under "Email" section, configure:
   - **SMTP Settings** (recommended for production)
   - Or use **Supabase Email** (limited for development)

#### B. Rate Limiting
**Problem**: Too many OTP requests
**Solution**: Wait 1-2 minutes and try again

#### C. Invalid Email Format
**Problem**: Email doesn't exist or is malformed
**Solution**: Use a valid email address

#### D. User Doesn't Exist
**Problem**: Trying to send OTP to non-existent user
**Solution**: 
- Either create the user first, OR
- Use `shouldCreateUser: true` in the OTP options

### 3. Quick Fixes to Try

#### Option 1: Enable User Creation
```typescript
const { data, error } = await supabase.auth.signInWithOtp({ 
  email,
  options: {
    shouldCreateUser: true, // Allow creating new users
  }
})
```

#### Option 2: Use Password Reset Instead
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
})
```

#### Option 3: Check Supabase Project Settings
1. Go to Supabase Dashboard
2. Project Settings → API
3. Verify your project URL and anon key
4. Check if the project is paused or has issues

### 4. Test with Different Email
Try with a known working email address to isolate the issue.

### 5. Check Network Tab
1. Open browser DevTools → Network tab
2. Try sending OTP
3. Look for the failed request to `/auth/v1/otp`
4. Check the response body for more details

## 🛠️ Immediate Workaround

If OTP continues to fail, you can temporarily use the traditional password reset:

```typescript
// In login page, replace signInWithOtp with:
const { error } = await resetPassword(email);
```

This will send a password reset link instead of an OTP.

## 📋 Next Steps

1. **Check Supabase Dashboard** for email configuration
2. **Test with a different email** address
3. **Check browser console** for detailed error logs
4. **Verify project status** in Supabase dashboard
5. **Contact Supabase support** if issue persists

## 🔧 Environment Check

Make sure these are set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://pfbcpqifhbqpymnagzss.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 📞 Support

If none of these solutions work:
1. Check [Supabase Status Page](https://status.supabase.com/)
2. Contact Supabase support with your project ID
3. Share the detailed error logs from console
