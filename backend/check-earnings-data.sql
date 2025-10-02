-- Check earnings data and view status
-- Run these queries in your Supabase SQL Editor to diagnose the issue

-- 1. Check if the view exists and is accessible
SELECT * FROM information_schema.views 
WHERE table_name = 'earnings_summary' 
AND table_schema = 'public';

-- 2. Check total appointments count
SELECT COUNT(*) as total_appointments FROM appointments;

-- 3. Check appointments by status
SELECT status, COUNT(*) as count 
FROM appointments 
GROUP BY status;

-- 4. Check if there are any completed appointments
SELECT COUNT(*) as completed_appointments 
FROM appointments 
WHERE status = 'completed';

-- 5. Check the earnings_summary view directly
SELECT * FROM earnings_summary LIMIT 10;

-- 6. Check if there are any appointments at all
SELECT id, client_id, title, date, status, price 
FROM appointments 
ORDER BY created_at DESC 
LIMIT 5;
