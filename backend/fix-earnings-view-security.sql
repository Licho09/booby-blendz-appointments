-- Fix earnings_summary view security issue
-- This script removes the SECURITY DEFINER property and recreates the view with proper security

-- Drop the existing view
DROP VIEW IF EXISTS public.earnings_summary;

-- Recreate the view with SECURITY INVOKER (default behavior)
-- This ensures the view runs with the permissions of the querying user, not the creator
CREATE VIEW public.earnings_summary 
WITH (security_invoker = true) AS
SELECT 
    DATE_TRUNC('day', date) as date,
    COUNT(*) as appointments,
    SUM(price) as total_earnings,
    AVG(price) as avg_price
FROM appointments 
WHERE status = 'completed'
GROUP BY DATE_TRUNC('day', date)
ORDER BY date DESC;

-- Grant appropriate permissions to the view
GRANT SELECT ON public.earnings_summary TO anon, authenticated;

-- Add a comment explaining the security model
COMMENT ON VIEW public.earnings_summary IS 'Earnings summary view with security invoker - runs with querying user permissions';
