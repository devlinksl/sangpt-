ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS ai_response_style text NOT NULL DEFAULT 'chatgpt',
  ADD COLUMN IF NOT EXISTS animation_intensity text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS response_width text NOT NULL DEFAULT 'standard';