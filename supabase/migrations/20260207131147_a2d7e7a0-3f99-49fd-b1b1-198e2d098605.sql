
-- Add settings columns to user_preferences
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS response_style text DEFAULT 'balanced',
  ADD COLUMN IF NOT EXISTS typing_speed text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS data_mode text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS animations boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS new_chat_auto boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notifications boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sound_haptics boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS analytics_opt_out boolean DEFAULT false;
