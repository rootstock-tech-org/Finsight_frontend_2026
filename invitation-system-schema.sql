-- Invitation System Database Schema
-- Run this in your Supabase SQL Editor

-- Create invitation_tokens table
CREATE TABLE IF NOT EXISTS invitation_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitation_form_states table
CREATE TABLE IF NOT EXISTS invitation_form_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    form_data JSONB DEFAULT '{}',
    step TEXT NOT NULL DEFAULT 'initial',
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one form state per user per token
    UNIQUE(user_id, token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_token ON invitation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_user_id ON invitation_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_email ON invitation_tokens(email);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_expires_at ON invitation_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_used ON invitation_tokens(used);

CREATE INDEX IF NOT EXISTS idx_invitation_form_states_user_id ON invitation_form_states(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_form_states_token ON invitation_form_states(token);
CREATE INDEX IF NOT EXISTS idx_invitation_form_states_step ON invitation_form_states(step);
CREATE INDEX IF NOT EXISTS idx_invitation_form_states_completed ON invitation_form_states(completed);

-- Enable RLS (Row Level Security)
ALTER TABLE invitation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_form_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitation_tokens
CREATE POLICY "Users can view own invitation tokens" ON invitation_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invitation tokens" ON invitation_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invitation tokens" ON invitation_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invitation tokens" ON invitation_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for invitation_form_states
CREATE POLICY "Users can view own form states" ON invitation_form_states
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own form states" ON invitation_form_states
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own form states" ON invitation_form_states
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own form states" ON invitation_form_states
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON invitation_tokens TO anon, authenticated;
GRANT ALL ON invitation_form_states TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create function to clean up expired tokens (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM invitation_tokens 
    WHERE expires_at < NOW() AND used = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_invitation_tokens_updated_at
    BEFORE UPDATE ON invitation_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitation_form_states_updated_at
    BEFORE UPDATE ON invitation_form_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the setup
SELECT 'Invitation system tables created successfully!' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('invitation_tokens', 'invitation_form_states') 
AND table_schema = 'public';
