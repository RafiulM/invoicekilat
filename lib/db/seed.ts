import { sql } from "drizzle-orm";
import { db } from "./index";
import { templates } from "./schema";
import { TEMPLATES } from "../dummy-data";

async function main() {
  await db
    .insert(templates)
    .values(
      TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        accent: t.accent,
        isActive: true,
      })),
    )
    .onConflictDoUpdate({
      target: templates.id,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        accent: sql`excluded.accent`,
      },
    });

  console.log(`Seeded ${TEMPLATES.length} templates.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
