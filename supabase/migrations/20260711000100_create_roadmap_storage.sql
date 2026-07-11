create extension if not exists pgcrypto;

create table if not exists public.roadmap_documents (
  slug text primary key,
  document jsonb not null,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.roadmap_documents is
  'Versioned JSON documents used by the public AiMS roadmap.';

alter table public.roadmap_documents enable row level security;

create policy "Public roadmap documents are readable"
on public.roadmap_documents
for select
to anon, authenticated
using (true);

create table if not exists public.manager_runs (
  run_id text primary key,
  request text not null,
  agent text not null,
  status text not null,
  approval_required boolean not null default false,
  decision text,
  next_action text,
  mode text not null,
  tools_used jsonb not null default '[]'::jsonb,
  output_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.manager_runs is
  'Private Manager Agent execution and approval audit records.';

alter table public.manager_runs enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger roadmap_documents_set_updated_at
before update on public.roadmap_documents
for each row execute function public.set_updated_at();

create trigger manager_runs_set_updated_at
before update on public.manager_runs
for each row execute function public.set_updated_at();

revoke all on table public.roadmap_documents from anon, authenticated;
grant select on table public.roadmap_documents to anon, authenticated;

revoke all on table public.manager_runs from anon, authenticated;
