-- Quick Fix: Create User Profile for Testing
-- Run this in your Supabase SQL editor to quickly test the first name display

-- First, check if you have a user_profiles table
-- If this fails, you need to run the full migration first
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE EXCEPTION 'user_profiles table does not exist. Please run the full migration first.';
    END IF;
    
    -- Check if you have the new columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'first_name') THEN
        RAISE EXCEPTION 'New columns not found. Please run the full migration first.';
    END IF;
    
    RAISE NOTICE 'Table structure looks good!';
END $$;

-- If you get here, the table exists with new columns
-- Now let's create a profile for your current user (replace with your actual user ID)
-- You can find your user ID in the auth.users table

-- Option 1: Create profile for a specific user (replace USER_ID_HERE with your actual user ID)
INSERT INTO user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    full_name,
    mobile_number,
    communication_preference,
    stock_update_frequency,
    subscription_tier
) VALUES (
    'USER_ID_HERE', -- Replace with your actual user ID from auth.users
    'your-email@example.com', -- Replace with your actual email
    'Tushar', -- Replace with your actual first name
    'Sopa', -- Replace with your actual last name
    'Tushar Sopa', -- Full name
    '9876543210', -- Replace with your actual mobile number
    'whatsapp',
    'daily',
    'free'
) ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name,
    mobile_number = EXCLUDED.mobile_number,
    communication_preference = EXCLUDED.communication_preference,
    stock_update_frequency = EXCLUDED.stock_update_frequency,
    updated_at = NOW();

-- Option 2: Create profiles for all users who don't have one (safer approach)
INSERT INTO user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    full_name,
    mobile_number,
    communication_preference,
    stock_update_frequency,
    subscription_tier
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'first_name', SPLIT_PART(u.email, '@', 1)),
    COALESCE(u.raw_user_meta_data->>'last_name', ''),
    COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1)),
    COALESCE(u.raw_user_meta_data->>'mobile_number', ''),
    COALESCE(u.raw_user_meta_data->>'communication_preference', 'whatsapp'),
    COALESCE(u.raw_user_meta_data->>'stock_update_frequency', 'daily'),
    'free'
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Check the results
SELECT 
    'Total profiles created' as status,
    COUNT(*) as count
FROM user_profiles;

SELECT 
    'Sample profile' as status,
    first_name,
    last_name,
    email,
    communication_preference,
    stock_update_frequency
FROM user_profiles 
LIMIT 1;
