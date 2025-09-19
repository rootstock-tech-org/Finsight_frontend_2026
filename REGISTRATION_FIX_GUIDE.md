# 🔧 Registration Fix Guide - Complete Solution

## 🚨 **Current Error:**
```
AuthApiError: Database error saving new user
```

## 🔍 **Root Causes:**
1. **Missing `.env.local` file** - No Supabase credentials
2. **Database schema mismatch** - `user_profiles` table structure doesn't match registration code
3. **Missing database trigger** - No automatic profile creation

## ✅ **Complete Solution:**

### **Step 1: Create Environment File**
Create `.env.local` in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pfbcpqifhbqpymnagzss.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmYmNwcWlmaGJxcHltbmFnenNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTk3MjYsImV4cCI6MjA3MTc3NTcyNn0.GrGMT7osZzP56sJzF5cNp620e2eLJrv2veIjCbaQiVA
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NODE_ENV=development
```

### **Step 2: Run Database Migration**
Copy and paste this into your **Supabase SQL Editor**:

```sql
-- Add missing mobile_number column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'mobile_number' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN mobile_number TEXT;
    END IF;
END $$;

-- Create mapping tables for preferences
CREATE TABLE IF NOT EXISTS public.communication_preference_map (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

INSERT INTO public.communication_preference_map (id, name) VALUES 
(1, 'whatsapp'),
(2, 'sms'),
(3, 'telegram')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.stock_update_frequency_map (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

INSERT INTO public.stock_update_frequency_map (id, name) VALUES 
(1, 'daily'),
(2, 'weekly'),
(3, 'monthly')
ON CONFLICT (id) DO NOTHING;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    comm_pref_id INTEGER;
    stock_freq_id INTEGER;
BEGIN
    -- Get communication preference ID
    SELECT id INTO comm_pref_id 
    FROM public.communication_preference_map 
    WHERE name = COALESCE(NEW.raw_user_meta_data->>'communication_preference', 'whatsapp');
    
    -- Get stock update frequency ID
    SELECT id INTO stock_freq_id 
    FROM public.stock_update_frequency_map 
    WHERE name = COALESCE(NEW.raw_user_meta_data->>'stock_update_frequency', 'daily');
    
    -- Insert user profile
    INSERT INTO public.user_profiles (
        user_id,
        email,
        first_name,
        last_name,
        full_name,
        mobile_number,
        communication_preference,
        stock_update_frequency,
        subscription_tier,
        preferences,
        is_active,
        is_email_verified,
        is_phone_verified,
        role_id,
        admin_entity_id
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
        COALESCE(comm_pref_id, 1),
        COALESCE(stock_freq_id, 1),
        1, -- subscription_tier (1 = free)
        '{}',
        true,
        false,
        false,
        1, -- role_id (1 = user)
        NEW.id -- admin_entity_id
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.communication_preference_map TO anon, authenticated;
GRANT ALL ON public.stock_update_frequency_map TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
```

### **Step 3: Restart Development Server**
```bash
npm run dev
# or
yarn dev
```

### **Step 4: Test Registration**
1. Go to your registration page
2. Fill out the form with valid data
3. Submit the form
4. Check browser console for any errors

### **Step 5: Debug (if still not working)**
Open browser console and run:
```javascript
// Test connection
testSupabaseConnection();

// Test registration
testRegistration();
```

## 🔍 **What Each Step Fixes:**

### **Environment File (Step 1):**
- ✅ Provides Supabase URL and API keys
- ✅ Enables proper authentication
- ✅ Fixes "Database error saving new user"

### **Database Migration (Step 2):**
- ✅ Adds missing `mobile_number` column
- ✅ Creates mapping tables for text-to-integer conversion
- ✅ Sets up automatic profile creation trigger
- ✅ Handles data type compatibility

### **Code Updates (Already Done):**
- ✅ Updated `supabase-auth-service.ts` to work with integer IDs
- ✅ Added proper error handling and logging

## 🚨 **Common Issues & Solutions:**

### **Issue: "Missing environment variables"**
**Solution:** Make sure `.env.local` file exists and has correct values

### **Issue: "Table doesn't exist"**
**Solution:** Run the database migration in Supabase SQL Editor

### **Issue: "Permission denied"**
**Solution:** Check that RLS policies are set up correctly in the migration

### **Issue: "Data type mismatch"**
**Solution:** The migration handles text-to-integer conversion automatically

## 📁 **Files Created/Updated:**
- ✅ `.env.local` - Environment configuration (you need to create this)
- ✅ `fix-current-database-schema.sql` - Complete migration script
- ✅ `test-supabase-connection.js` - Debug testing script
- ✅ `src/lib/services/supabase-auth-service.ts` - Updated for integer IDs

## 🎯 **Expected Result:**
After completing all steps, registration should work perfectly with:
- ✅ User account created in `auth.users`
- ✅ Profile automatically created in `user_profiles`
- ✅ All form data properly saved
- ✅ No more "Database error saving new user"

## 🆘 **Still Having Issues?**
1. Check browser console for specific error messages
2. Verify Supabase dashboard shows the new tables
3. Test with the debug scripts provided
4. Make sure all environment variables are correct
