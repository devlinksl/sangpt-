ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS font_style text DEFAULT 'sans',
  ADD COLUMN IF NOT EXISTS chat_density text DEFAULT 'comfortable',
  ADD COLUMN IF NOT EXISTS bubble_style text DEFAULT 'rounded';

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;