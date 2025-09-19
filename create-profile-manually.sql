-- Manual Profile Creation Script
-- Run this in your Supabase SQL Editor

-- First, let's check what exists
SELECT '=== CHECKING EXISTING PROFILES ===' as section;

SELECT 
    id,
    user_id,
    email,
    first_name,
    last_name,
    created_at
FROM user_profiles 
WHERE user_id = '454ad0ad-09cc-4134-afca-b4f04e9f5fbd'
   OR email = 'tusharasopa07@gmail.com';

-- Check if user exists in auth.users
SELECT '=== CHECKING AUTH.USERS ===' as section;

SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE id = '454ad0ad-09cc-4134-afca-b4f04e9f5fbd'
   OR email = 'tusharasopa07@gmail.com';

-- Create profile if it doesn't exist
DO $$
DECLARE
    user_uuid UUID := '454ad0ad-09cc-4134-afca-b4f04e9f5fbd';
    user_email TEXT := 'tusharasopa07@gmail.com';
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS(
        SELECT 1 FROM user_profiles WHERE user_id = user_uuid
    ) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Insert new profile
        INSERT INTO user_profiles (
            user_id,
            email,
            first_name,
            last_name,
            full_name,
            mobile_number,
            communication_preference,
            stock_update_frequency,
            subscription_tier,
            preferences
        ) VALUES (
            user_uuid,
            user_email,
            'Tushar',
            'Sopa',
            'Tushar Sopa',
            '9876543210',
            'whatsapp',
            'daily',
            'free',
            '{}'
        );
        
        RAISE NOTICE 'Profile created successfully for user %', user_email;
    ELSE
        RAISE NOTICE 'Profile already exists for user %', user_email;
    END IF;
    
    -- Verify the profile
    SELECT '=== VERIFICATION ===' as section;
    SELECT * FROM user_profiles WHERE user_id = user_uuid;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating profile: %', SQLERRM;
END $$;

