-- Fix for single-user system UUID issue
-- Run this in your Supabase SQL Editor

-- Create the user with the correct UUID
INSERT INTO users (id, email, password_hash)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'luischirinos1000@gmail.com',
    '$2a$10$dummy.hash.for.single.user.system'
)
ON CONFLICT (email) DO NOTHING;

-- Verify the user exists with the correct UUID
SELECT id, email FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440000';