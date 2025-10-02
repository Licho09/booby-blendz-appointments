-- Fix Supabase Security Warnings
-- Run this script in your Supabase SQL Editor to resolve all security warnings

-- 1. Fix Function Search Path Mutable warnings
-- Drop and recreate the update_updated_at_column function with secure search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Drop and recreate the update_updatedat_column function (if it exists)
DROP FUNCTION IF EXISTS public.update_updatedat_column();

-- 2. Update triggers to use the secure function
-- Drop existing triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;

-- Recreate triggers with secure function
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add security comment
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Secure trigger function with fixed search_path to prevent SQL injection';

-- 4. Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon, authenticated;
