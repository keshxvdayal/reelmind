import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { PromptChips } from "@/components/ask-bar";
import { PlacesView } from "@/components/places-view";
import { Empty, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { placesOf } from "@/lib/insights";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Places" };

export default async function PlacesPage() {
  const user = await requireUser();
  const db = await readDb();
  const titles = new Map(db.items.map((i) => [i.id, i.analysis?.title ?? "Save"]));
  const places = placesOf(db, user.id).map((p) => ({ name: p.name, count: p.count, sections: p.sections, saves: p.itemIds.map((id) => ({ id, title: titles.get(id) ?? "Save" })) }));
  return (
    <div className="rise space-y-6">
      <PageHeader eyebrow="Explore" title="Places" subtitle={`Every city, café, beach and venue mentioned in your saves${places.length ? `: ${places.length} so far` : ""}.`} />
      {places.length ? (
        <>
          <PromptChips prompts={[`Plan a trip to ${places[0].name} from my saves`, "Which places did I save for a weekend getaway?", "Group my saved places by city"]} />
          <PlacesView places={places} />
        </>
      ) : (
        <Empty icon={<MapPin className="h-5 w-5" />} title="No places yet">
          Places show up here as you save travel, food and city reels.
        </Empty>
      )}
    </div>
  );
}
