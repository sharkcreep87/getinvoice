-- Create ai_usage table to track daily AI request usage
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_type TEXT NOT NULL CHECK (request_type IN ('cost_forecast', 'receipt_scan')),
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(user_id, usage_date, request_type)
);

-- Create indexes for ai_usage
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON public.ai_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_type ON public.ai_usage(request_type);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_usage
CREATE POLICY "Users can view own usage"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON public.ai_usage FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER set_ai_usage_updated_at
  BEFORE UPDATE ON public.ai_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment AI usage count
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id UUID,
  p_request_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Insert or update usage count for today
  INSERT INTO public.ai_usage (user_id, usage_date, request_type, request_count)
  VALUES (p_user_id, CURRENT_DATE, p_request_type, 1)
  ON CONFLICT (user_id, usage_date, request_type)
  DO UPDATE SET
    request_count = public.ai_usage.request_count + 1,
    updated_at = NOW()
  RETURNING request_count INTO current_count;

  RETURN current_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get today's usage count
CREATE OR REPLACE FUNCTION get_today_ai_usage(
  p_user_id UUID,
  p_request_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  SELECT COALESCE(request_count, 0)
  INTO usage_count
  FROM public.ai_usage
  WHERE user_id = p_user_id
    AND usage_date = CURRENT_DATE
    AND request_type = p_request_type;

  RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total usage for today (all types combined)
CREATE OR REPLACE FUNCTION get_total_today_ai_usage(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(request_count), 0)
  INTO total_count
  FROM public.ai_usage
  WHERE user_id = p_user_id
    AND usage_date = CURRENT_DATE;

  RETURN COALESCE(total_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
