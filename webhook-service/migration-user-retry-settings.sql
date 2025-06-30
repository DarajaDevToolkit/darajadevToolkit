-- Migration to add user retry settings and enhanced delivery tracking
-- Run this migration to set up the new database tables

-- User retry settings table
CREATE TABLE IF NOT EXISTS user_retry_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  environment VARCHAR(20) NOT NULL DEFAULT 'dev',
  max_retries INTEGER NOT NULL DEFAULT 3,
  retry_delay_ms INTEGER NOT NULL DEFAULT 2000,
  timeout_ms INTEGER NOT NULL DEFAULT 25000,
  enable_circuit_breaker BOOLEAN DEFAULT false,
  circuit_breaker_threshold INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, environment)
);

-- Enhanced delivery attempts table (add new columns to existing table)
DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'delivery_attempts' AND column_name = 'user_id') THEN
    ALTER TABLE delivery_attempts ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  -- Add queue_job_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'delivery_attempts' AND column_name = 'queue_job_id') THEN
    ALTER TABLE delivery_attempts ADD COLUMN queue_job_id VARCHAR(255);
  END IF;

  -- Add target_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'delivery_attempts' AND column_name = 'target_url') THEN
    ALTER TABLE delivery_attempts ADD COLUMN target_url TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add response_headers column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'delivery_attempts' AND column_name = 'response_headers') THEN
    ALTER TABLE delivery_attempts ADD COLUMN response_headers JSONB;
  END IF;

  -- Add error_category column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'delivery_attempts' AND column_name = 'error_category') THEN
    ALTER TABLE delivery_attempts ADD COLUMN error_category VARCHAR(50);
  END IF;

  -- Add duration column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'delivery_attempts' AND column_name = 'duration') THEN
    ALTER TABLE delivery_attempts ADD COLUMN duration INTEGER;
  END IF;

  -- Add retryable column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'delivery_attempts' AND column_name = 'retryable') THEN
    ALTER TABLE delivery_attempts ADD COLUMN retryable BOOLEAN DEFAULT true;
  END IF;
END
$$;

-- Retry history table for analytics and audit
CREATE TABLE IF NOT EXISTS retry_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_job_id VARCHAR(255) NOT NULL,
  total_attempts INTEGER NOT NULL,
  final_status VARCHAR(20) NOT NULL, -- 'delivered', 'failed', 'moved_to_dlq'
  first_attempt_at TIMESTAMP NOT NULL,
  last_attempt_at TIMESTAMP NOT NULL,
  total_duration INTEGER, -- Total time from first to last attempt in ms
  failure_categories JSONB, -- Array of error categories encountered
  retry_pattern JSONB, -- Retry delays used
  dlq_job_id VARCHAR(255), -- If moved to DLQ
  metadata JSONB, -- Additional tracking data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_retry_settings_user_env ON user_retry_settings(user_id, environment);
CREATE INDEX IF NOT EXISTS idx_delivery_attempts_user_id ON delivery_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_attempts_queue_job_id ON delivery_attempts(queue_job_id);
CREATE INDEX IF NOT EXISTS idx_retry_history_user_id ON retry_history(user_id);
CREATE INDEX IF NOT EXISTS idx_retry_history_webhook_id ON retry_history(webhook_id);
CREATE INDEX IF NOT EXISTS idx_retry_history_final_status ON retry_history(final_status);
CREATE INDEX IF NOT EXISTS idx_retry_history_created_at ON retry_history(created_at);

-- Insert default retry settings for existing users
INSERT INTO user_retry_settings (user_id, environment, max_retries, retry_delay_ms, timeout_ms)
SELECT id, 'dev', 3, 2000, 25000
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_retry_settings 
  WHERE user_retry_settings.user_id = users.id 
  AND user_retry_settings.environment = 'dev'
);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_user_retry_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_user_retry_settings_updated_at ON user_retry_settings;
CREATE TRIGGER trigger_user_retry_settings_updated_at
  BEFORE UPDATE ON user_retry_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_retry_settings_updated_at();

-- Create some test data for development
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Create a test user if none exists
  INSERT INTO users (name, email, phone_number, password_hash, api_key)
  VALUES (
    'Test User',
    'test@example.com',
    '+1234567890',
    'hashed_password_123',
    'test_api_key_123'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO test_user_id;

  -- If we inserted a new user, create webhook and settings
  IF test_user_id IS NOT NULL THEN
    -- Create a test webhook
    INSERT INTO webhooks (user_id, url, event_type, description)
    VALUES (
      test_user_id,
      'http://localhost:3002/webhooks/mpesa',
      'stk_push_result',
      'Test webhook for development'
    );

    -- Create custom retry settings for different environments
    INSERT INTO user_retry_settings (user_id, environment, max_retries, retry_delay_ms, timeout_ms)
    VALUES 
      (test_user_id, 'dev', 3, 2000, 25000),
      (test_user_id, 'staging', 2, 1500, 20000),
      (test_user_id, 'production', 5, 3000, 30000);
  END IF;
END
$$;

COMMIT;

-- Show summary of changes
SELECT 
  'user_retry_settings' as table_name,
  COUNT(*) as row_count
FROM user_retry_settings
UNION ALL
SELECT 
  'retry_history' as table_name,
  COUNT(*) as row_count
FROM retry_history
UNION ALL
SELECT 
  'users' as table_name,
  COUNT(*) as row_count
FROM users
UNION ALL
SELECT 
  'webhooks' as table_name,
  COUNT(*) as row_count
FROM webhooks;
