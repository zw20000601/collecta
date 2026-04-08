-- =============================================
-- Collecta Platform - Supabase Database Schema
-- =============================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_cron;

-- =============================================
-- TABLES
-- =============================================

-- Profiles (synced from auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text default 'user' check (role in ('user', 'admin')),
  status text default 'active' check (status in ('active', 'banned')),
  created_at timestamptz default now()
);

-- Resource categories
create table if not exists public.resource_categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  icon text,
  sort_order int default 100,
  created_at timestamptz default now()
);

-- Insert default uncategorized category
insert into public.resource_categories (name, icon, sort_order)
values ('uncategorized', '📁', 9999)
on conflict (name) do nothing;

-- Resources
create table if not exists public.resources (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  description text not null default '',
  url text not null,
  category_id uuid references public.resource_categories(id) on delete set null,
  category_name text default '',
  tags text[] default '{}',
  note text default '',
  cover_url text default '',
  is_public boolean default false,
  favorite_count int default 0,
  view_count int default 0,
  created_at timestamptz default now()
);

-- Favorites
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, resource_id)
);

-- Messages (留言板)
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  title text,
  content text,
  category text check (category in ('资源需求', '功能建议', '问题反馈')),
  status text default '待处理' check (status in ('待处理', '开发中', '已完成')),
  vote_count int default 0,
  reply_count int default 0,
  yesterday_vote_count int default 0,
  priority_date date,
  created_at timestamptz default now()
);

-- Message votes
create table if not exists public.message_votes (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (message_id, user_id)
);

-- Message replies
create table if not exists public.message_replies (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  is_official boolean default false,
  created_at timestamptz default now()
);

-- Admin logs
create table if not exists public.admin_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references public.profiles(id) on delete set null,
  admin_email text,
  action text not null,
  target_type text,
  target_id text,
  detail text,
  created_at timestamptz default now()
);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Maintain favorite_count on resources
create or replace function public.update_favorite_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update public.resources set favorite_count = favorite_count + 1 where id = new.resource_id;
  elsif TG_OP = 'DELETE' then
    update public.resources set favorite_count = greatest(0, favorite_count - 1) where id = old.resource_id;
  end if;
  return null;
end;
$$;

drop trigger if exists update_resource_favorite_count on public.favorites;
create trigger update_resource_favorite_count
  after insert or delete on public.favorites
  for each row execute function public.update_favorite_count();

-- Maintain vote_count on messages
create or replace function public.update_vote_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update public.messages set vote_count = vote_count + 1 where id = new.message_id;
  elsif TG_OP = 'DELETE' then
    update public.messages set vote_count = greatest(0, vote_count - 1) where id = old.message_id;
  end if;
  return null;
end;
$$;

drop trigger if exists update_message_vote_count on public.message_votes;
create trigger update_message_vote_count
  after insert or delete on public.message_votes
  for each row execute function public.update_vote_count();

-- Maintain reply_count on messages
create or replace function public.update_reply_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update public.messages set reply_count = reply_count + 1 where id = new.message_id;
  elsif TG_OP = 'DELETE' then
    update public.messages set reply_count = greatest(0, reply_count - 1) where id = old.message_id;
  end if;
  return null;
end;
$$;

drop trigger if exists update_message_reply_count on public.message_replies;
create trigger update_message_reply_count
  after insert or delete on public.message_replies
  for each row execute function public.update_reply_count();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.profiles enable row level security;
alter table public.resource_categories enable row level security;
alter table public.resources enable row level security;
alter table public.favorites enable row level security;
alter table public.messages enable row level security;
alter table public.message_votes enable row level security;
alter table public.message_replies enable row level security;
alter table public.admin_logs enable row level security;

-- Helper: check if current user is admin
-- Checks JWT claims first (fast), then falls back to profiles.role (allows
-- setting admin via: UPDATE profiles SET role='admin' WHERE email='x@x.com')
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select coalesce(
    auth.jwt() ->> 'role' = 'admin'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    ),
    false
  );
$$;

-- ⚠️  IMPORTANT: Run ALL three steps to grant yourself admin rights.
-- If you signed up before running this schema, your profile row may not exist yet.
-- Replace 'your@email.com' with your actual admin account email.
--
--   -- Step 1: ensure profile row exists
--   INSERT INTO public.profiles (id, email)
--   SELECT id, email FROM auth.users WHERE email = 'your@email.com'
--   ON CONFLICT (id) DO NOTHING;
--
--   -- Step 2: grant admin role
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
--
--   -- Step 3: verify (should return role = admin)
--   SELECT id, email, role FROM public.profiles WHERE email = 'your@email.com';
--

-- profiles
create policy "Public profiles are viewable" on public.profiles
  for select using (true);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Admins full access profiles" on public.profiles
  for all using (public.is_admin());

-- resource_categories (public read, admin write)
create policy "Anyone can view categories" on public.resource_categories
  for select using (true);
create policy "Admins manage categories" on public.resource_categories
  for all using (public.is_admin());

-- resources (public read for is_public=true, admin all)
create policy "Anyone can view public resources" on public.resources
  for select using (is_public = true or public.is_admin());
create policy "Admins manage resources" on public.resources
  for all using (public.is_admin());

-- favorites (user own rows only)
create policy "Users manage own favorites" on public.favorites
  for all using (auth.uid() = user_id);

-- messages (public read, logged-in write own)
create policy "Anyone can view messages" on public.messages
  for select using (true);
create policy "Logged-in users can create messages" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "Users can update own messages" on public.messages
  for update using (auth.uid() = user_id);
create policy "Admins full access messages" on public.messages
  for all using (public.is_admin());

-- message_votes
create policy "Anyone can view votes" on public.message_votes
  for select using (true);
create policy "Users manage own votes" on public.message_votes
  for insert with check (auth.uid() = user_id);
create policy "Users delete own votes" on public.message_votes
  for delete using (auth.uid() = user_id);

-- message_replies
create policy "Anyone can view replies" on public.message_replies
  for select using (true);
create policy "Logged-in users can reply" on public.message_replies
  for insert with check (auth.uid() = user_id and (is_official = false or public.is_admin()));
create policy "Admins manage replies" on public.message_replies
  for all using (public.is_admin());

-- admin_logs
create policy "Admins view logs" on public.admin_logs
  for select using (public.is_admin());
create policy "Admins insert logs" on public.admin_logs
  for insert with check (public.is_admin());

-- =============================================
-- pg_cron: Daily vote priority update at 08:00 CST (00:00 UTC)
-- =============================================
-- select cron.schedule(
--   'update-vote-priority',
--   '0 0 * * *',
--   $$
--     update public.messages
--     set
--       yesterday_vote_count = (
--         select count(*) from public.message_votes
--         where message_id = messages.id
--           and created_at >= (now() - interval '1 day')::date
--           and created_at < (now())::date
--       ),
--       priority_date = current_date
--   $$
-- );
