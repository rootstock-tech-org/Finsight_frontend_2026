-- Debug User Profile Issues
-- Run these queries in your Supabase SQL editor to diagnose the problem

-- 1. Check if user_profiles table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Check if the table has any data
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- 3. Check the most recent user profiles
SELECT 
    id,
    user_id,
    email,
    first_name,
    last_name,
    full_name,
    mobile_number,
    communication_preference,
    stock_update_frequency,
    created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check if the trigger function exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Check if the trigger function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 6. Check auth.users table for recent signups
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Check if RLS policies are blocking access
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles';
