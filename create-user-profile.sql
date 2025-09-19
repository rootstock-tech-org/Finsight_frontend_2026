-- Helper Script: Create User Profile
-- This will automatically find your user and create a profile

-- Step 1: Show all users so you can identify yours
SELECT '=== ALL USERS ===' as section;
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- Step 2: Create profile for a specific email (replace with your email)
-- Replace 'your-email@example.com' with your actual email address
DO $$
DECLARE
    user_email TEXT := 'your-email@example.com'; -- REPLACE WITH YOUR EMAIL
    user_uuid UUID;
    user_first_name TEXT := 'Tushar'; -- REPLACE WITH YOUR FIRST NAME
    user_last_name TEXT := 'Sopa';    -- REPLACE WITH YOUR LAST NAME
    user_mobile TEXT := '9876543210'; -- REPLACE WITH YOUR MOBILE
BEGIN
    -- Find the user ID
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Create the profile
    INSERT INTO user_profiles (
        user_id,
        email,
        first_name,
        last_name,
        full_name,
        mobile_number,
        communication_preference,
        stock_update_frequency
    ) VALUES (
        user_uuid,
        user_email,
        user_first_name,
        user_last_name,
        user_first_name || ' ' || user_last_name,
        user_mobile,
        'whatsapp',
        'daily'
    ) ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        full_name = EXCLUDED.full_name,
        mobile_number = EXCLUDED.mobile_number,
        communication_preference = EXCLUDED.communication_preference,
        stock_update_frequency = EXCLUDED.stock_update_frequency,
        updated_at = NOW();
    
    RAISE NOTICE 'Profile created/updated for user % with ID %', user_email, user_uuid;
END $$;

-- Step 3: Verify the profile was created
SELECT '=== VERIFICATION ===' as section;
SELECT 
    'Profile created' as status,
    first_name,
    last_name,
    email,
    mobile_number,
    communication_preference,
    stock_update_frequency
FROM user_profiles 
WHERE email = 'your-email@example.com'; -- REPLACE WITH YOUR EMAIL
