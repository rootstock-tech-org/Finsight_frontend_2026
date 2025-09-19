# Google OAuth Setup for FinSight

## Prerequisites
1. A Google Cloud Console account
2. Access to your Supabase project dashboard

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project (if needed)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API

### 1.2 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "FinSight"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users if needed

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)
5. Copy the Client ID and Client Secret

## Step 2: Supabase Dashboard Configuration

### 2.1 Enable Google Provider
1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" and click "Enable"
4. Enter your Google OAuth credentials:
   - Client ID: [Your Google Client ID]
   - Client Secret: [Your Google Client Secret]
5. Save the configuration

### 2.2 Configure Redirect URLs
1. In the same Google provider settings
2. Add your redirect URLs:
   - Production: `https://yourdomain.com/auth/callback`
   - Development: `http://localhost:3000/auth/callback`

## Step 3: Environment Variables (Optional)

If you want to configure OAuth redirects in your environment:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # for development
```

## Step 4: Test the Integration

1. Start your development server
2. Go to the login or register page
3. Click "Sign in with Google" or "Sign up with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back to your app

## Troubleshooting

### Common Issues:
1. **Redirect URI mismatch**: Ensure the redirect URIs in Google Cloud Console match exactly with Supabase
2. **CORS errors**: Check that your domain is properly configured in Supabase
3. **OAuth consent screen not configured**: Make sure you've completed the OAuth consent screen setup

### Error Messages:
- "redirect_uri_mismatch": Check redirect URI configuration
- "invalid_client": Verify Client ID and Secret
- "access_denied": User denied OAuth consent

## Security Notes

1. Never commit your Client Secret to version control
2. Use environment variables for sensitive configuration
3. Regularly rotate your OAuth credentials
4. Monitor OAuth usage in Google Cloud Console

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Verify Google Cloud Console configuration
3. Check browser console for errors
4. Ensure all redirect URIs are properly configured
