-- Update user_progress table to include more detailed data
-- Run this in your Supabase SQL Editor

-- Add new columns to existing table
ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS total_tests INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mock_exam_results JSONB DEFAULT '[]'::jsonb;

-- Update the table structure
ALTER TABLE user_progress 
ALTER COLUMN test_history SET DEFAULT '[]'::jsonb,
ALTER COLUMN study_time SET DEFAULT 0,
ALTER COLUMN average_score SET DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_total_tests ON user_progress(total_tests);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_sync ON user_progress(last_sync);

-- Update the policy to be more permissive for now
DROP POLICY IF EXISTS "Users can access their own progress" ON user_progress;
CREATE POLICY "Allow all operations on user_progress" ON user_progress
  FOR ALL USING (true);
