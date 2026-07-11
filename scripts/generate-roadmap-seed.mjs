import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roadmapPath = path.join(root, "src", "roadmap.json");
const migrationPath = path.join(
  root,
  "supabase",
  "migrations",
  "20260711000300_seed_aims_roadmap.sql",
);

const roadmap = JSON.parse(await readFile(roadmapPath, "utf8"));
const document = JSON.stringify(roadmap, null, 2);

if (document.includes("$aims_roadmap$")) {
  throw new Error("Roadmap contains the SQL delimiter.");
}

const sql = `insert into public.roadmap_documents (slug, document, version)
values (
  'aims-roadmap',
  $aims_roadmap$${document}$aims_roadmap$::jsonb,
  1
)
on conflict (slug) do update
set document = excluded.document,
    version = public.roadmap_documents.version + 1;
`;

await writeFile(migrationPath, sql, "utf8");
console.log(`Generated ${path.relative(root, migrationPath)}`);
