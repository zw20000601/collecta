-- ==========================================================
-- Collecta: Update logs table for frontend changelog page
-- ==========================================================

create table if not exists public.update_logs (
  id uuid primary key default uuid_generate_v4(),
  version text not null,
  title text not null,
  content text not null,
  published_at date not null default current_date,
  is_public boolean not null default true,
  sort_order int not null default 100,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_update_logs_public_date
  on public.update_logs(is_public, published_at desc, created_at desc);

create index if not exists idx_update_logs_sort
  on public.update_logs(sort_order asc);

create or replace function public.touch_update_logs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_update_logs_updated_at on public.update_logs;
create trigger trg_touch_update_logs_updated_at
  before update on public.update_logs
  for each row execute function public.touch_update_logs_updated_at();

alter table public.update_logs enable row level security;

drop policy if exists "Anyone can view public update logs" on public.update_logs;
create policy "Anyone can view public update logs" on public.update_logs
  for select using (is_public = true or public.is_admin());

drop policy if exists "Admins manage update logs" on public.update_logs;
create policy "Admins manage update logs" on public.update_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- Optional seed data
insert into public.update_logs (version, title, content, published_at, is_public, sort_order)
values (
  'v1.0.0',
  '项目初始化上线',
  '完成基础页面与账号系统\n完成资源上传与收藏功能',
  current_date,
  true,
  100
)
on conflict do nothing;
