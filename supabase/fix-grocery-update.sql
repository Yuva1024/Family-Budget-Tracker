-- ================================================================
-- FamilyFlow: Fix completely for checking off grocery items
-- Run this in the Supabase SQL Editor.
-- ================================================================

-- 1. Create the safe helper function (prevents infinite recursion)
CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM profiles WHERE id = auth.uid();
$$;

-- 2. Drop any potentially conflicting UPDATE policies on grocery_items
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'grocery_items' 
      AND cmd = 'UPDATE'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON grocery_items', r.policyname);
  END LOOP;
END$$;

-- 3. Create a single, clean UPDATE policy allowing anyone in the family to update items
CREATE POLICY "Users can update grocery items in own family"
  ON grocery_items FOR UPDATE
  USING (family_id = get_my_family_id())
  WITH CHECK (family_id = get_my_family_id());

-- 4. Just in case, ensure the expenses INSERT policy is also completely permissive within the family
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'expenses' 
      AND cmd = 'INSERT'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON expenses', r.policyname);
  END LOOP;
END$$;

CREATE POLICY "Users can insert expenses in own family"
  ON expenses FOR INSERT
  WITH CHECK (family_id = get_my_family_id());
