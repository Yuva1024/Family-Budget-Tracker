-- Create extension for UUID generation if not exists
create extension if not exists "uuid-ossp";

-- 1. Families Table
create table public.families (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    invite_code text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Profiles Table (Linked to Supabase Auth)
create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    family_id uuid references public.families(id) on delete set null,
    name text not null,
    avatar_url text,
    role text check (role in ('admin', 'member')) default 'member',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tasks Table
create table public.tasks (
    id uuid default uuid_generate_v4() primary key,
    family_id uuid references public.families(id) on delete cascade not null,
    title text not null,
    description text,
    assigned_to uuid references public.profiles(id) on delete set null,
    created_by uuid references public.profiles(id) on delete cascade not null,
    deadline timestamp with time zone,
    priority text check (priority in ('low', 'medium', 'high')) default 'medium',
    status text check (status in ('pending', 'in-progress', 'completed')) default 'pending',
    completed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Grocery Items Table
create table public.grocery_items (
    id uuid default uuid_generate_v4() primary key,
    family_id uuid references public.families(id) on delete cascade not null,
    item_name text not null,
    quantity integer default 1,
    price numeric default 0,
    added_by uuid references public.profiles(id) on delete cascade not null,
    checked boolean default false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Expenses Table
create table public.expenses (
    id uuid default uuid_generate_v4() primary key,
    family_id uuid references public.families(id) on delete cascade not null,
    title text not null,
    amount numeric not null,
    category text not null,
    paid_by uuid references public.profiles(id) on delete cascade not null,
    date date not null,
    notes text,
    grocery_item_id uuid references public.grocery_items(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Messages Table
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    family_id uuid references public.families(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Investments Table (New)
create table public.investments (
    id uuid default uuid_generate_v4() primary key,
    family_id uuid references public.families(id) on delete cascade not null,
    name text not null,
    type text check (type in ('FD', 'RD', 'SIP', 'Bond', 'Real Estate', 'Asset', 'Cash', 'Stock', 'Other')) not null,
    principal_amount numeric not null default 0,
    current_value numeric not null default 0,
    interest_rate numeric,
    start_date date,
    maturity_date date,
    institution text,
    added_by uuid references public.profiles(id) on delete cascade not null,
    notes text,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Configuration

-- Enable RLS on all tables
alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.grocery_items enable row level security;
alter table public.expenses enable row level security;
alter table public.messages enable row level security;
alter table public.investments enable row level security;

-- Policies for Families
create policy "Users can view their own family" on public.families
    for select using (id = (select family_id from public.profiles where id = auth.uid()));
create policy "Authenticated users can create families" on public.families
    for insert with check (auth.role() = 'authenticated');

-- Policies for Profiles
create policy "Users can view profiles in their family" on public.profiles
    for select using (
        id = auth.uid() or
        family_id = (select family_id from public.profiles where id = auth.uid())
    );
create policy "Users can insert their own profile" on public.profiles
    for insert with check (id = auth.uid());
create policy "Users can update their own profile" on public.profiles
    for update using (id = auth.uid());

-- Policies for Tasks
create policy "Users can view tasks in their family" on public.tasks
    for select using (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can create tasks in their family" on public.tasks
    for insert with check (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can update tasks in their family" on public.tasks
    for update using (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can delete tasks in their family" on public.tasks
    for delete using (family_id = (select family_id from public.profiles where id = auth.uid()));

-- Policies for Grocery Items
create policy "Users can view grocery items in their family" on public.grocery_items
    for select using (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can create grocery items in their family" on public.grocery_items
    for insert with check (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can update grocery items in their family" on public.grocery_items
    for update using (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can delete grocery items in their family" on public.grocery_items
    for delete using (family_id = (select family_id from public.profiles where id = auth.uid()));

-- Policies for Expenses
create policy "Users can view expenses in their family" on public.expenses
    for select using (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can create expenses in their family" on public.expenses
    for insert with check (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can update expenses in their family" on public.expenses
    for update using (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can delete expenses in their family" on public.expenses
    for delete using (family_id = (select family_id from public.profiles where id = auth.uid()));

-- Policies for Messages
create policy "Users can view messages in their family" on public.messages
    for select using (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can create messages in their family" on public.messages
    for insert with check (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can update messages in their family" on public.messages
    for update using (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can delete messages in their family" on public.messages
    for delete using (family_id = (select family_id from public.profiles where id = auth.uid()));

-- Policies for Investments
create policy "Users can view investments in their family" on public.investments
    for select using (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can create investments in their family" on public.investments
    for insert with check (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can update investments in their family" on public.investments
    for update using (family_id = (select family_id from public.profiles where id = auth.uid()));
create policy "Users can delete investments in their family" on public.investments
    for delete using (family_id = (select family_id from public.profiles where id = auth.uid()));

-- Enable Realtime
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.grocery_items;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.investments;
