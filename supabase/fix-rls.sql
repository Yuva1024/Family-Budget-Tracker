-- ============================================================
-- FIX: Drop recursive RLS policies and replace with safe ones.
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- 1. Drop ALL old policies that cause recursion
drop policy if exists "Users can read own family profiles" on profiles;
drop policy if exists "Users can read own family tasks" on tasks;
drop policy if exists "Users can insert tasks in own family" on tasks;
drop policy if exists "Users can update tasks in own family" on tasks;
drop policy if exists "Users can read own family grocery items" on grocery_items;
drop policy if exists "Users can insert grocery items in own family" on grocery_items;
drop policy if exists "Users can update grocery items in own family" on grocery_items;
drop policy if exists "Users can read own family expenses" on expenses;
drop policy if exists "Users can insert expenses in own family" on expenses;
drop policy if exists "Users can read own family messages" on messages;
drop policy if exists "Users can insert messages in own family" on messages;

-- 2. Create a SECURITY DEFINER function to safely get the user's family_id
--    This bypasses RLS so it won't cause recursion.
create or replace function get_my_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from profiles where id = auth.uid();
$$;

-- 3. PROFILES policies
-- Users can always read their own profile
create policy "Users can read own profile"
  on profiles for select
  using (id = auth.uid());

-- Users can read profiles of members in the same family
create policy "Users can read family profiles"
  on profiles for select
  using (family_id = get_my_family_id());

-- Users can insert their own profile (on sign-up)
create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

-- 4. FAMILIES policies
alter table families enable row level security;

-- Anyone authenticated can create a family
create policy "Authenticated users can create families"
  on families for insert
  with check (auth.uid() is not null);

-- Users can read their own family
create policy "Users can read own family"
  on families for select
  using (id = get_my_family_id());

-- 5. TASKS policies
create policy "Read own family tasks"
  on tasks for select
  using (family_id = get_my_family_id());

create policy "Insert own family tasks"
  on tasks for insert
  with check (family_id = get_my_family_id());

create policy "Update own family tasks"
  on tasks for update
  using (family_id = get_my_family_id());

-- 6. GROCERY ITEMS policies
create policy "Read own family grocery items"
  on grocery_items for select
  using (family_id = get_my_family_id());

create policy "Insert own family grocery items"
  on grocery_items for insert
  with check (family_id = get_my_family_id());

create policy "Update own family grocery items"
  on grocery_items for update
  using (family_id = get_my_family_id());

-- 7. EXPENSES policies
create policy "Read own family expenses"
  on expenses for select
  using (family_id = get_my_family_id());

create policy "Insert own family expenses"
  on expenses for insert
  with check (family_id = get_my_family_id());

-- 8. MESSAGES policies
create policy "Read own family messages"
  on messages for select
  using (family_id = get_my_family_id());

create policy "Insert own family messages"
  on messages for insert
  with check (family_id = get_my_family_id());
