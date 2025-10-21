-- Supabase Database Setup for Theory Coach AI
-- Run this in your Supabase SQL Editor

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  test_history JSONB DEFAULT '[]'::jsonb,
  study_time DECIMAL DEFAULT 0,
  average_score DECIMAL DEFAULT 0,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access their own data
CREATE POLICY "Users can access their own progress" ON user_progress
  FOR ALL USING (auth.uid()::text = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON user_progress TO authenticated;
GRANT ALL ON user_progress TO anon;
