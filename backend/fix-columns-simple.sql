-- Simple fix for column names - run this in Supabase SQL Editor

-- First, let's see what columns we actually have
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients';

-- Fix the clients table
ALTER TABLE clients RENAME COLUMN user_id TO "userId";

-- Fix the appointments table  
ALTER TABLE appointments RENAME COLUMN client_id TO "clientId";
ALTER TABLE appointments RENAME COLUMN user_id TO "userId";

-- Fix the users table
ALTER TABLE users RENAME COLUMN created_at TO "createdAt";
ALTER TABLE users RENAME COLUMN updated_at TO "updatedAt";

-- Fix the clients table
ALTER TABLE clients RENAME COLUMN created_at TO "createdAt";
ALTER TABLE clients RENAME COLUMN updated_at TO "updatedAt";

-- Fix the appointments table
ALTER TABLE appointments RENAME COLUMN created_at TO "createdAt";
ALTER TABLE appointments RENAME COLUMN updated_at TO "updatedAt";

