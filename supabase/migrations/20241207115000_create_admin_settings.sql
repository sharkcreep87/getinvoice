-- Create admin_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create index for fast lookup by setting_key
CREATE INDEX IF NOT EXISTS idx_admin_settings_setting_key ON public.admin_settings(setting_key);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_settings
-- Anyone can read admin settings
CREATE POLICY "Anyone can read admin settings"
  ON public.admin_settings FOR SELECT
  USING (true);

-- Only admins can insert admin settings (will be enforced at application level)
CREATE POLICY "Service role can insert admin settings"
  ON public.admin_settings FOR INSERT
  WITH CHECK (true);

-- Only admins can update admin settings (will be enforced at application level)
CREATE POLICY "Service role can update admin settings"
  ON public.admin_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER set_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default AI request limit
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES (
  'daily_ai_request_limit',
  '5',
  'Maximum number of AI requests (cost forecast + receipt scan) per user per day'
)
ON CONFLICT (setting_key) DO NOTHING;
