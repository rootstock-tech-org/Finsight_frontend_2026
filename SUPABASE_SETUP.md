# Supabase Setup Guide for FinSight

This guide will help you set up Supabase for your FinSight Next.js application.

## 🚀 Quick Start

### 1. Project Setup
- **Project URL**: `https://pfbcpqifhbqpymnagzss.supabase.co`
- **API Key (anon)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmYmNwcWlmaGJxcHltbmFnbnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTk3MjYsImV4cCI6MjA3MTc3NTcyNn0.GrGMT7osZzP56sJzF5cNp620e2eLJrv2veIjCbaQiVA`

### 2. Install Dependencies
```bash
npm install @supabase/ssr @supabase/supabase-js
```

## 🗄️ Database Setup

### 1. Run Schema
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `supabase-schema.sql`
5. Click **Run** to execute the schema

### 2. Verify Tables
After running the schema, you should see these tables:
- `user_profiles`
- `analysis_records`
- `watchlist`
- `stocks`
- `market_data`
- `news`
- `notifications`
- `subscriptions`

## 📁 Storage Setup

### 1. Create Storage Bucket
1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name: `finsight-files`
4. Public bucket: ✅ **Yes**
5. Click **Create bucket**

### 2. Set Storage Policies
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## 🔐 Authentication Setup

### 1. Email Configuration
1. Go to **Authentication** → **Settings**
2. Configure your SMTP settings:
   - **SMTP Host**: Your SMTP server
   - **SMTP Port**: Usually 587 or 465
   - **SMTP User**: Your email username
   - **SMTP Pass**: Your email password
   - **Sender Name**: FinSight
   - **Sender Email**: Your verified email

### 2. Site URL Configuration
1. Go to **Authentication** → **Settings**
2. Set **Site URL** to: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/login`
   - `http://localhost:3000/register`

### 3. Email Templates (Optional)
1. Go to **Authentication** → **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Magic link

## 🧪 Testing

### 1. Test Connection
1. Start your development server: `npm run dev`
2. Go to `/dashboard`
3. Click on **Supabase Test** tab
4. Run the **Connection** test

### 2. Test Authentication
1. Run the **Sign Up** test
2. Check your email for confirmation
3. Run the **Login** test

### 3. Test Database
1. Run the **Database Tables** test
2. Verify data is being created in Supabase dashboard

## 🔧 Troubleshooting

### Common Issues

#### 1. Email Rate Limit Exceeded
- **Solution**: Disable email confirmation temporarily
- Go to **Authentication** → **Settings** → Turn OFF "Enable email confirmations"

#### 2. Connection Failed
- Verify your project URL and API key
- Check if your project is active
- Ensure you're using the correct region

#### 3. Authentication Errors
- Check browser console for errors
- Verify email templates are configured
- Check SMTP settings

#### 4. Database Access Denied
- Ensure RLS policies are properly set
- Check if the trigger function exists
- Verify table permissions

### Debug Steps
1. Check browser console for JavaScript errors
2. Check Supabase dashboard logs
3. Verify environment variables
4. Test individual components

## 📚 Next Steps

After successful setup:

1. **Customize Authentication**: Add Google OAuth, social logins
2. **Enhance Security**: Implement additional RLS policies
3. **Add Features**: Real-time subscriptions, file uploads
4. **Production**: Update site URLs and SMTP settings
5. **Monitoring**: Set up Supabase analytics and monitoring

## 🆘 Support

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the [Supabase Community](https://github.com/supabase/supabase/discussions)
3. Check your project logs in the Supabase dashboard
4. Verify all configuration steps were completed

---

**Note**: Keep your API keys secure and never commit them to version control. Use environment variables in production.
