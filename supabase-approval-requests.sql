-- ==========================================================
-- Collecta: Admin approval workflow for destructive actions
-- ==========================================================

create table if not exists public.admin_approval_requests (
  id uuid primary key default uuid_generate_v4(),
  action_type text not null check (action_type in ('delete_resource', 'delete_message', 'delete_message_reply', 'delete_category')),
  target_id text not null,
  target_label text default '',
  reason text default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_by uuid not null references public.profiles(id) on delete cascade,
  requested_by_email text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_by_email text,
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_admin_approval_requests_status_created_at
  on public.admin_approval_requests(status, created_at desc);

create index if not exists idx_admin_approval_requests_target
  on public.admin_approval_requests(action_type, target_id);

alter table public.admin_approval_requests enable row level security;

drop policy if exists "Admins view approval requests" on public.admin_approval_requests;
create policy "Admins view approval requests" on public.admin_approval_requests
  for select using (public.is_admin());

drop policy if exists "Admins create approval requests" on public.admin_approval_requests;
create policy "Admins create approval requests" on public.admin_approval_requests
  for insert with check (public.is_admin() and requested_by = auth.uid());

drop policy if exists "Admins update approval requests" on public.admin_approval_requests;
create policy "Admins update approval requests" on public.admin_approval_requests
  for update using (public.is_admin());

