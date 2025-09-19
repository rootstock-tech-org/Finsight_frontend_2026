-- Fix Current Database Schema for Registration
-- This script fixes the existing user_profiles table to work with registration

-- Step 1: Check current state
SELECT '=== CURRENT STATE ===' as section;

-- Show current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add missing columns and fix data types
-- Add mobile_number column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'mobile_number' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN mobile_number TEXT;
    END IF;
END $$;

-- Step 3: Create a mapping table for communication preferences
CREATE TABLE IF NOT EXISTS public.communication_preference_map (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Insert mapping values
INSERT INTO public.communication_preference_map (id, name) VALUES 
(1, 'whatsapp'),
(2, 'sms'),
(3, 'telegram')
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create a mapping table for stock update frequencies
CREATE TABLE IF NOT EXISTS public.stock_update_frequency_map (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Insert mapping values
INSERT INTO public.stock_update_frequency_map (id, name) VALUES 
(1, 'daily'),
(2, 'weekly'),
(3, 'monthly')
ON CONFLICT (id) DO NOTHING;

-- Step 5: Update existing data to use proper integer values
-- Update communication_preference to use integer values
UPDATE public.user_profiles 
SET communication_preference = CASE 
    WHEN communication_preference::text = 'whatsapp' THEN 1
    WHEN communication_preference::text = 'sms' THEN 2
    WHEN communication_preference::text = 'telegram' THEN 3
    ELSE 1
END
WHERE communication_preference IS NOT NULL;

-- Update stock_update_frequency to use integer values
UPDATE public.user_profiles 
SET stock_update_frequency = CASE 
    WHEN stock_update_frequency::text = 'daily' THEN 1
    WHEN stock_update_frequency::text = 'weekly' THEN 2
    WHEN stock_update_frequency::text = 'monthly' THEN 3
    ELSE 1
END
WHERE stock_update_frequency IS NOT NULL;

-- Step 6: Create or replace the trigger function
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
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.communication_preference_map TO anon, authenticated;
GRANT ALL ON public.stock_update_frequency_map TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- Step 9: Verify the setup
SELECT '=== VERIFICATION ===' as section;

-- Check if mobile_number column exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_profiles' 
                    AND column_name = 'mobile_number' 
                    AND table_schema = 'public') 
        THEN '✅ mobile_number column exists'
        ELSE '❌ mobile_number column missing'
    END as mobile_number_status;

-- Check trigger exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers 
                    WHERE event_object_table = 'users' 
                    AND event_object_schema = 'auth'
                    AND trigger_name = 'on_auth_user_created') 
        THEN '✅ Trigger exists'
        ELSE '❌ Trigger missing'
    END as trigger_status;

-- Check mapping tables
SELECT 'Communication preferences:' as section;
SELECT * FROM public.communication_preference_map;

SELECT 'Stock update frequencies:' as section;
SELECT * FROM public.stock_update_frequency_map;

SELECT '=== SETUP COMPLETE ===' as section;
SELECT 'Database schema has been fixed for registration!' as status;
