-- Debug User Profile Fetching Issue
-- Run this in your Supabase SQL Editor to find the problem

-- 1. Check if user_profiles table exists and has data
SELECT '=== TABLE CHECK ===' as section;
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') 
        THEN '✅ user_profiles table exists'
        ELSE '❌ user_profiles table does NOT exist'
    END as table_status;

-- 2. Check table structure
SELECT '=== TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Count total profiles
SELECT '=== PROFILE COUNT ===' as section;
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- 4. Check recent user profiles
SELECT '=== RECENT PROFILES ===' as section;
SELECT 
    id,
    user_id,
    email,
    first_name,
    last_name,
    created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Check auth.users table for your current user
SELECT '=== AUTH USERS ===' as section;
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Check if your user has a profile
-- Replace 'your-email@example.com' with your actual email
SELECT '=== YOUR USER CHECK ===' as section;
SELECT 
    'Auth User' as source,
    id,
    email,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'your-email@example.com'  -- REPLACE WITH YOUR EMAIL
UNION ALL
SELECT 
    'User Profile' as source,
    user_id as id,
    email,
    NULL as raw_user_meta_data
FROM user_profiles 
WHERE email = 'your-email@example.com';  -- REPLACE WITH YOUR EMAIL

-- 7. Check RLS policies
SELECT '=== RLS POLICIES ===' as section;
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 8. Test direct query (this will show if RLS is blocking access)
SELECT '=== DIRECT QUERY TEST ===' as section;
-- This simulates what your app is trying to do
SELECT 
    'Direct query result' as test,
    COUNT(*) as accessible_profiles
FROM user_profiles;

-- 9. Check if trigger is working
SELECT '=== TRIGGER CHECK ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 10. Check trigger function
SELECT '=== TRIGGER FUNCTION ===' as section;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
