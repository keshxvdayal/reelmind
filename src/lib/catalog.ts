import type { Catalog } from "@/components/answer";
import type { Db } from "@/lib/types";
import { toView } from "@/lib/view";

/** id → title/emoji for every save, so chat answers can render [[save:ID]] markers as chips. */
export function buildCatalog(db: Db, userId: string): Catalog {
  const out: Catalog = {};
  for (const item of db.items) {
    if (item.userId !== userId) continue;
    const v = toView(db, item);
    out[v.id] = { id: v.id, title: v.title, emoji: v.section?.emoji ?? "🗂️", section: v.section?.name ?? "" };
  }
  return out;
}
