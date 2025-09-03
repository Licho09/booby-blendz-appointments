-- Fix column names from snake_case to camelCase
-- Run this in your Supabase SQL Editor

-- Rename client_id to clientId in appointments table
ALTER TABLE appointments RENAME COLUMN client_id TO "clientId";

-- Rename user_id to userId in clients table
ALTER TABLE clients RENAME COLUMN user_id TO "userId";

-- Rename user_id to userId in appointments table
ALTER TABLE appointments RENAME COLUMN user_id TO "userId";

-- Rename created_at to createdAt in all tables
ALTER TABLE users RENAME COLUMN created_at TO "createdAt";
ALTER TABLE clients RENAME COLUMN created_at TO "createdAt";
ALTER TABLE appointments RENAME COLUMN created_at TO "createdAt";

-- Rename updated_at to updatedAt in all tables
ALTER TABLE users RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE clients RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE appointments RENAME COLUMN updated_at TO "updatedAt";

-- Update the index names to match
DROP INDEX IF EXISTS idx_clients_user_id;
DROP INDEX IF EXISTS idx_appointments_user_id;
DROP INDEX IF EXISTS idx_appointments_client_id;

CREATE INDEX idx_clients_userId ON clients("userId");
CREATE INDEX idx_appointments_userId ON appointments("userId");
CREATE INDEX idx_appointments_clientId ON appointments("clientId");

-- Update the trigger function to use new column name
CREATE OR REPLACE FUNCTION update_updatedAt_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update the triggers to use new column name
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;

CREATE TRIGGER update_users_updatedAt BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();

CREATE TRIGGER update_clients_updatedAt BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();

CREATE TRIGGER update_appointments_updatedAt BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();

-- Update the earnings view to use new column names
DROP VIEW IF EXISTS earnings_summary;
CREATE VIEW earnings_summary AS
SELECT 
    DATE_TRUNC('day', date) as date,
    COUNT(*) as appointments,
    SUM(price) as total_earnings,
    AVG(price) as avg_price
FROM appointments 
WHERE status = 'completed'
GROUP BY DATE_TRUNC('day', date)
ORDER BY date DESC;

