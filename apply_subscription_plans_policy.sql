-- This script adds the missing UPDATE policy for subscription_plans
-- Run this in your Supabase SQL Editor or via CLI

-- Add UPDATE policy for subscription_plans table to allow admins to update plans
CREATE POLICY IF NOT EXISTS "Admins can update subscription plans" ON public.subscription_plans
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'subscription_plans';
