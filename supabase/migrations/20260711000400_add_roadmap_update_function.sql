create or replace function public.update_roadmap_document(
  p_slug text,
  p_document jsonb,
  p_expected_version integer
)
returns table (
  slug text,
  document jsonb,
  version integer,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.roadmap_documents as roadmap
  set document = p_document,
      version = roadmap.version + 1
  where roadmap.slug = p_slug
    and roadmap.version = p_expected_version
  returning roadmap.slug, roadmap.document, roadmap.version, roadmap.updated_at;

  if not found then
    raise exception 'roadmap version conflict' using errcode = '40001';
  end if;
end;
$$;

revoke all on function public.update_roadmap_document(text, jsonb, integer) from public;
revoke all on function public.update_roadmap_document(text, jsonb, integer) from anon;
revoke all on function public.update_roadmap_document(text, jsonb, integer) from authenticated;
grant execute on function public.update_roadmap_document(text, jsonb, integer) to service_role;
