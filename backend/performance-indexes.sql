-- Performance optimization indexes for Booby_Blendz
-- Run this in your Supabase SQL Editor to improve query performance

-- Composite index for appointments ordering (most important)
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date, time);

-- Index for client lookups
CREATE INDEX IF NOT EXISTS idx_appointments_client_id_optimized ON appointments(client_id) WHERE client_id IS NOT NULL;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_appointments_status_optimized ON appointments(status) WHERE status IS NOT NULL;

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_appointments_date_range ON appointments(date) WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Index for completed appointments (earnings calculations)
CREATE INDEX IF NOT EXISTS idx_appointments_completed_earnings ON appointments(date, price) WHERE status = 'completed';

-- Optimize clients table
CREATE INDEX IF NOT EXISTS idx_clients_name_lookup ON clients(name);

-- Add partial index for active appointments
CREATE INDEX IF NOT EXISTS idx_appointments_active ON appointments(date, time) 
WHERE status IN ('scheduled', 'pending') AND date >= CURRENT_DATE;

-- Analyze tables to update statistics
ANALYZE appointments;
ANALYZE clients;
