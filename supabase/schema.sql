-- FamilyFlow Database Schema for Supabase PostgreSQL
-- Run this in the Supabase SQL Editor to create all tables.

-- ─── Families ───
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  created_at timestamptz default now()
);

-- ─── Profiles (extends auth.users) ───
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  family_id uuid references families(id) on delete set null,
  role text default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now()
);

-- ─── Tasks ───
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid[] default '{}',
  deadline timestamptz,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  status text default 'pending' check (status in ('pending', 'in-progress', 'completed')),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- ─── Grocery Items ───
create table if not exists grocery_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  item_name text not null,
  quantity int default 1,
  price numeric(10,2) default 0,
  checked boolean default false,
  added_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ─── Expenses ───
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  title text not null,
  amount numeric(10,2) not null,
  category text default 'Misc',
  paid_by uuid references profiles(id),
  date date default current_date,
  notes text,
  created_at timestamptz default now()
);

-- ─── Messages ───
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  user_id uuid references profiles(id),
  message text not null,
  created_at timestamptz default now()
);

-- ─── Enable Realtime ───
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table grocery_items;
alter publication supabase_realtime add table messages;

-- ─── Row Level Security (basic) ───
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table grocery_items enable row level security;
alter table expenses enable row level security;
alter table messages enable row level security;

-- Policy: users can read data from their own family
create policy "Users can read own family profiles"
  on profiles for select
  using (family_id = (select family_id from profiles where id = auth.uid()));

create policy "Users can read own family tasks"
  on tasks for select
  using (family_id = (select family_id from profiles where id = auth.uid()));

create policy "Users can insert tasks in own family"
  on tasks for insert
  with check (family_id = (select family_id from profiles where id = auth.uid()));

create policy "Users can update tasks in own family"
  on tasks for update
  using (family_id = (select family_id from profiles where id = auth.uid()));

create policy "Users can read own family grocery items"
  on grocery_items for select
  using (family_id = (select family_id from profiles where id = auth.uid()));

create policy "Users can insert grocery items in own family"
  on grocery_items for insert
  with check (family_id = (select family_id from profiles where id = auth.uid()));

create policy "Users can update grocery items in own family"
  on grocery_items for update
  using (family_id = (select family_id from profiles where id = auth.uid()));

create policy "Users can read own family expenses"
  on expenses for select
  using (family_id = (select family_id from profiles where id = auth.uid()));

create policy "Users can insert expenses in own family"
  on expenses for insert
  with check (family_id = (select family_id from profiles where id = auth.uid()));

create policy "Users can read own family messages"
  on messages for select
  using (family_id = (select family_id from profiles where id = auth.uid()));

create policy "Users can insert messages in own family"
  on messages for insert
  with check (family_id = (select family_id from profiles where id = auth.uid()));
