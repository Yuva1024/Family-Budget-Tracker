-- ============================================================
-- FamilyFlow: Consolidated RLS + Realtime Fix
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── 1. Drop ALL existing RLS policies to avoid conflicts ───
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END$$;

-- Drop helper function if it exists
DROP FUNCTION IF EXISTS get_my_family_id();

-- ─── 2. Create SECURITY DEFINER function (prevents RLS recursion) ───
CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM profiles WHERE id = auth.uid();
$$;

-- ─── 3. Enable RLS on all tables ───
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE families  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages  ENABLE ROW LEVEL SECURITY;

-- ─── 4. PROFILES policies ───
-- Users can always read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can read profiles of members in the same family
CREATE POLICY "profiles_select_family"
  ON profiles FOR SELECT
  USING (family_id = get_my_family_id());

-- Users can insert their own profile (on sign-up)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ─── 5. FAMILIES policies ───
-- Anyone authenticated can create a family
CREATE POLICY "families_insert"
  ON families FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can read their own family
CREATE POLICY "families_select_own"
  ON families FOR SELECT
  USING (id = get_my_family_id());

-- Allow reading families by invite_code (needed for join flow)
CREATE POLICY "families_select_by_code"
  ON families FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─── 6. TASKS policies (SELECT, INSERT, UPDATE, DELETE) ───
CREATE POLICY "tasks_select"
  ON tasks FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "tasks_insert"
  ON tasks FOR INSERT
  WITH CHECK (family_id = get_my_family_id());

CREATE POLICY "tasks_update"
  ON tasks FOR UPDATE
  USING (family_id = get_my_family_id());

CREATE POLICY "tasks_delete"
  ON tasks FOR DELETE
  USING (family_id = get_my_family_id());

-- ─── 7. GROCERY ITEMS policies (SELECT, INSERT, UPDATE, DELETE) ───
CREATE POLICY "grocery_items_select"
  ON grocery_items FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "grocery_items_insert"
  ON grocery_items FOR INSERT
  WITH CHECK (family_id = get_my_family_id());

CREATE POLICY "grocery_items_update"
  ON grocery_items FOR UPDATE
  USING (family_id = get_my_family_id());

CREATE POLICY "grocery_items_delete"
  ON grocery_items FOR DELETE
  USING (family_id = get_my_family_id());

-- ─── 8. EXPENSES policies (SELECT, INSERT, UPDATE, DELETE) ───
CREATE POLICY "expenses_select"
  ON expenses FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "expenses_insert"
  ON expenses FOR INSERT
  WITH CHECK (family_id = get_my_family_id());

CREATE POLICY "expenses_update"
  ON expenses FOR UPDATE
  USING (family_id = get_my_family_id());

CREATE POLICY "expenses_delete"
  ON expenses FOR DELETE
  USING (family_id = get_my_family_id());

-- ─── 9. MESSAGES policies (SELECT, INSERT, UPDATE, DELETE) ───
CREATE POLICY "messages_select"
  ON messages FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "messages_insert"
  ON messages FOR INSERT
  WITH CHECK (family_id = get_my_family_id());

CREATE POLICY "messages_update"
  ON messages FOR UPDATE
  USING (family_id = get_my_family_id());

CREATE POLICY "messages_delete"
  ON messages FOR DELETE
  USING (family_id = get_my_family_id());

-- ─── 10. Enable REPLICA IDENTITY FULL so DELETE events include full row payload ───
-- (Required for Supabase Realtime to send full row data on DELETE events,
--  so the client can filter/identify which row was deleted)
ALTER TABLE tasks         REPLICA IDENTITY FULL;
ALTER TABLE grocery_items REPLICA IDENTITY FULL;
ALTER TABLE expenses      REPLICA IDENTITY FULL;
ALTER TABLE messages      REPLICA IDENTITY FULL;
ALTER TABLE profiles      REPLICA IDENTITY FULL;

-- ─── 11. Ensure ALL tables are in the Supabase realtime publication ───
-- Drop and recreate to avoid "already a member" errors
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE families;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
