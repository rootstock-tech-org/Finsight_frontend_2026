-- Complete Migration Fix for user_profiles table
-- Run this in your Supabase SQL Editor to fix the missing columns

-- Step 1: Check current state
SELECT '=== CURRENT STATE ===' as section;
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') 
        THEN '✅ user_profiles table exists'
        ELSE '❌ user_profiles table does NOT exist'
    END as table_status;

-- Step 2: Drop existing table if it has wrong structure
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Step 3: Create the correct user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT,
    mobile_number TEXT NOT NULL,
    communication_preference TEXT NOT NULL DEFAULT 'whatsapp',
    stock_update_frequency TEXT NOT NULL DEFAULT 'daily',
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_mobile_number ON user_profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_communication_preference ON user_profiles(communication_preference);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stock_update_frequency ON user_profiles(stock_update_frequency);

-- Step 5: Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 7: Create function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 10: Create function to handle new user signup
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

-- Step 11: Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 12: Verify the table structure
SELECT '=== VERIFICATION ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Step 13: Check if trigger exists
SELECT '=== TRIGGER VERIFICATION ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 14: Check RLS policies
SELECT '=== RLS POLICIES ===' as section;
SELECT 
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'user_profiles';
