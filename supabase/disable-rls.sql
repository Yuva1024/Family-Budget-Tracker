-- ============================================================
-- DISABLE ALL RLS — remove all restrictions for MVP testing.
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- Drop all existing policies
do $$
declare
  r record;
begin
  for r in (
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  ) loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end$$;

-- Drop the helper function if it exists
drop function if exists get_my_family_id();

-- Disable RLS on all tables
alter table profiles disable row level security;
alter table families disable row level security;
alter table tasks disable row level security;
alter table grocery_items disable row level security;
alter table expenses disable row level security;
alter table messages disable row level security;
