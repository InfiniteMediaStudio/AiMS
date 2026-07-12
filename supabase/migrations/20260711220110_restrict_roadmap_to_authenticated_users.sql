drop policy if exists "Public roadmap documents are readable" on public.roadmap_documents;

revoke all on table public.roadmap_documents from anon;
revoke all on table public.roadmap_documents from authenticated;
grant select on table public.roadmap_documents to authenticated;

create policy "Authenticated users can read roadmap documents"
on public.roadmap_documents
for select
to authenticated
using ((select auth.uid()) is not null);
