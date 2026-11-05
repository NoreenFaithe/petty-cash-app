-- ===================================================================
-- PettyCash Pro - PostgreSQL Database Schema (For Supabase / Remote Teams)
-- ===================================================================
-- Instructions:
-- 1. Create a free project at https://supabase.com
-- 2. Open "SQL Editor" in your Supabase dashboard
-- 3. Paste this script and click "Run"
-- ===================================================================

-- 1. Users Table (Consultants & Managers)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'consultant',
    title TEXT,
    dept TEXT,
    avatar TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Reimbursement Claims Table
CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    consultant_id TEXT,
    consultant_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    is_client_refund BOOLEAN DEFAULT FALSE,
    client_name TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    replenish_status TEXT DEFAULT 'none',
    replenish_batch_id TEXT,
    receipt_name TEXT,
    receipt_type TEXT,
    receipt_size INTEGER,
    receipt_data TEXT,
    submitted_at TEXT,
    released_at TEXT,
    released_by TEXT,
    audit_log JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Petty Cash Fund (PCF) Float & Replenishment Monitor Table
CREATE TABLE IF NOT EXISTS pcf_settings (
    key TEXT PRIMARY KEY,
    pcf_amount NUMERIC(12, 2) DEFAULT 5000.00,
    replenishments JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default PCF float limit if not present
INSERT INTO pcf_settings (key, pcf_amount, replenishments)
VALUES ('default_pcf', 5000.00, '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Enable Row Level Security (RLS) with Public Anon Access for Web App
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcf_settings ENABLE ROW LEVEL SECURITY;

-- Allow web app anon key full read & write access
DROP POLICY IF EXISTS "Anon public access users" ON users;
CREATE POLICY "Anon public access users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access claims" ON claims;
CREATE POLICY "Anon public access claims" ON claims FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access pcf_settings" ON pcf_settings;
CREATE POLICY "Anon public access pcf_settings" ON pcf_settings FOR ALL USING (true) WITH CHECK (true);
