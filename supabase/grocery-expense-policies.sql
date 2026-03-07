-- ================================================================
-- FamilyFlow: Grocery History & Expense Management Policies
-- Run this in the Supabase SQL Editor.
-- ================================================================

-- ─── 1. Add completed_at column to grocery_items ───
ALTER TABLE grocery_items
  ADD COLUMN IF NOT EXISTS completed_at timestamptz DEFAULT NULL;

-- ─── 2. Add grocery_item_id to expenses (links auto-created expenses) ───
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS grocery_item_id uuid REFERENCES grocery_items(id) ON DELETE SET NULL DEFAULT NULL;

-- ─── 3. RLS policies for expenses UPDATE and DELETE ───

-- Allow family members to update expenses in their family
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update expenses in own family'
  ) THEN
    CREATE POLICY "Users can update expenses in own family"
      ON expenses FOR UPDATE
      USING (family_id = get_my_family_id());
  END IF;
END $$;

-- Allow family members to delete expenses in their family
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete expenses in own family'
  ) THEN
    CREATE POLICY "Users can delete expenses in own family"
      ON expenses FOR DELETE
      USING (family_id = get_my_family_id());
  END IF;
END $$;

-- ─── 4. RLS policy for grocery_items DELETE ───
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete grocery items in own family'
  ) THEN
    CREATE POLICY "Users can delete grocery items in own family"
      ON grocery_items FOR DELETE
      USING (family_id = get_my_family_id());
  END IF;
END $$;

-- ─── 5. Add expenses to realtime publication (if not already) ───
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
  END IF;
END $$;
