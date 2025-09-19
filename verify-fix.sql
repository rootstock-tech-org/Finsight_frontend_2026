-- Verify Fix: Check if user profiles are now working
-- Run this in your Supabase SQL editor to confirm the fix

-- 1. Check table structure
SELECT 'Table Structure Check' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Check if you have user profiles
SELECT 'User Profiles Count' as check_type;
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- 3. Check a sample profile
SELECT 'Sample Profile Data' as check_type;
SELECT 
    first_name,
    last_name,
    email,
    mobile_number,
    communication_preference,
    stock_update_frequency,
    created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 3;

-- 4. Check if trigger is working
SELECT 'Trigger Check' as check_type;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Check RLS policies
SELECT 'RLS Policies Check' as check_type;
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 6. Test query with auth context (this simulates what your app does)
SELECT 'Auth Context Test' as check_type;
-- This will show if the current user can access their profile
SELECT 
    'Current user can access profiles' as status,
    COUNT(*) as accessible_profiles
FROM user_profiles;
