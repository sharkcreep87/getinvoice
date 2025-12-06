-- Add UPDATE policy for subscription_plans table to allow admins to update plans
CREATE POLICY "Admins can update subscription plans" ON public.subscription_plans
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
