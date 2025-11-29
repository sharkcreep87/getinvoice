-- Update subscription plans pricing to MYR
UPDATE public.subscription_plans
SET price = CASE tier
    WHEN 'free' THEN 0
    WHEN 'basic' THEN 79
    WHEN 'pro' THEN 199
    WHEN 'enterprise' THEN 799
END
WHERE tier IN ('free', 'basic', 'pro', 'enterprise');

-- Add comment
COMMENT ON TABLE public.subscription_plans IS 'Subscription plans with pricing in MYR';
