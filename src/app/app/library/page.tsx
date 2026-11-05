import type { Metadata } from "next";
import Link from "next/link";
import { Library, Send } from "lucide-react";
import { AddSave } from "@/components/add-save";
import { LibraryView } from "@/components/library-view";
import { btn, Empty, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { sectionSummaries, userItems } from "@/lib/library";
import { readDb } from "@/lib/store";
import { pickerOptions, toView } from "@/lib/view";

export const metadata: Metadata = { title: "All saves" };

export default async function LibraryPage() {
  const user = await requireUser();
  const db = await readDb();
  const items = userItems(db, user.id).map((i) => toView(db, i));
  const sections = sectionSummaries(db, user.id).map(({ slug, name, emoji }) => ({ slug, name, emoji }));
  return (
    <div className="rise">
      <PageHeader eyebrow="Library" title="All saves" subtitle="Everything you've sent to ReelMind. Filter instantly, or select several to organise them." action={<AddSave />} />
      {items.length ? (
        <LibraryView items={items} sections={sections} {...pickerOptions(db, user.id)} />
      ) : (
        <Empty
          icon={<Library className="h-5 w-5" />}
          title="No saves yet"
          action={
            <Link href="/app/connect" className={btn.brand}>
              <Send className="h-4 w-4" /> Connect Instagram
            </Link>
          }
        >
          Share a reel to the bot on Instagram, or add one with the button above.
        </Empty>
      )}
    </div>
  );
}
