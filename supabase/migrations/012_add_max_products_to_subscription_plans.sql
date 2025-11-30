-- Add max_products column to subscription_plans table
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS max_products INTEGER NOT NULL DEFAULT 10;

-- Update subscription plans with product limits
UPDATE public.subscription_plans
SET max_products = CASE tier
    WHEN 'free' THEN 10
    WHEN 'basic' THEN 100
    WHEN 'pro' THEN -1    -- unlimited
    WHEN 'enterprise' THEN -1    -- unlimited
END
WHERE tier IN ('free', 'basic', 'pro', 'enterprise');

-- Add comment
COMMENT ON COLUMN public.subscription_plans.max_products IS 'Maximum number of products allowed (-1 for unlimited)';
