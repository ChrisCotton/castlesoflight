import { getDb } from "./server/db";
import { leads, interactions } from "./drizzle/schema";
import { inArray, and, gt, like, eq } from "drizzle-orm";

async function reset() {
  const db = await getDb();
  if (!db) {
    console.error("Could not connect to database");
    process.exit(1);
  }
  
  const leadIds = [78, 75, 63, 64, 65, 67, 68, 69, 70, 71, 74, 76, 77];
  
  // 1. Delete interactions
  // Using sql template if needed, but drizzle inArray should work
  const deleteResult = await db.delete(interactions)
    .where(
      and(
        inArray(interactions.leadId, leadIds),
        eq(interactions.type, "email"),
        like(interactions.title, "%sent%"),
        gt(interactions.createdAt, new Date("2026-04-26T00:00:00Z"))
      )
    );
  
  console.log(`Deleted interactions for leads: ${leadIds.join(", ")}`);

  // 2. Reset leads lastContactedAt to NULL
  for (const id of leadIds) {
    await db.update(leads)
      .set({ lastContactedAt: null })
      .where(eq(leads.id, id));
  }
  
  console.log(`Reset lastContactedAt for leads.`);
  process.exit(0);
}

reset().catch(err => {
  console.error(err);
  process.exit(1);
});
