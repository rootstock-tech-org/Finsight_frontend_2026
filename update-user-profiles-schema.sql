-- Migration to update user_profiles table with additional registration fields
-- Run this after your existing schema is set up

-- Add new columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS communication_preference TEXT DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS stock_update_frequency TEXT DEFAULT 'daily';

-- Update existing records to have default values
UPDATE user_profiles 
SET 
    first_name = COALESCE(first_name, SPLIT_PART(full_name, ' ', 1)),
    last_name = COALESCE(last_name, CASE 
        WHEN POSITION(' ' IN full_name) > 0 
        THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
        ELSE ''
    END),
    mobile_number = COALESCE(mobile_number, ''),
    communication_preference = COALESCE(communication_preference, 'whatsapp'),
    stock_update_frequency = COALESCE(stock_update_frequency, 'daily')
WHERE first_name IS NULL OR last_name IS NULL OR mobile_number IS NULL;

-- Make new columns NOT NULL after updating existing data
ALTER TABLE user_profiles 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL,
ALTER COLUMN mobile_number SET NOT NULL,
ALTER COLUMN communication_preference SET NOT NULL,
ALTER COLUMN stock_update_frequency SET NOT NULL;

-- Drop and recreate the trigger function with new fields
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id, 
        email, 
        first_name,
        last_name,
        full_name,
        mobile_number,
        communication_preference,
        stock_update_frequency
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name'),
        COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
        COALESCE(NEW.raw_user_meta_data->>'communication_preference', 'whatsapp'),
        COALESCE(NEW.raw_user_meta_data->>'stock_update_frequency', 'daily')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_user_profiles_mobile_number ON user_profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_communication_preference ON user_profiles(communication_preference);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stock_update_frequency ON user_profiles(stock_update_frequency);
