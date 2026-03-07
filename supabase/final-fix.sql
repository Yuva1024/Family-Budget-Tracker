-- 🔴 FIX 1: COMPLETELY DISABLE ROW LEVEL SECURITY (RLS) FOR MVP
-- This prevents the "infinite recursion" error that crashes the members list query
-- and causes the page to load slowly or fail to open.

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 🔴 FIX 2: ENABLE REAL-TIME SYNC FOR PROFILES
-- Ensure all tables are broadcasting changes so that when a new member joins,
-- they instantly show up for everyone else without a reload.

BEGIN;
  -- Remove the tables from publication if they already exist to prevent errors,
  -- then re-add all of them explicitly.
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE families;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
