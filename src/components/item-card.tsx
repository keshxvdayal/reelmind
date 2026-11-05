import Link from "next/link";
import { Check, Film, Heart, Image as ImageIcon, Link2, LoaderCircle, StickyNote } from "lucide-react";
import { chipStyle, tileStyle } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { ItemView } from "@/lib/view";

const KIND_ICON = { reel: Film, post: ImageIcon, story: ImageIcon, link: Link2, note: StickyNote };

export function ItemCard({ item, showSection = true, selected, onSelect }: { item: ItemView; showSection?: boolean; selected?: boolean; onSelect?: (id: string) => void }) {
  const Icon = KIND_ICON[item.kind];
  const key = item.section?.slug ?? "pending";
  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden" style={tileStyle(key)}>
        {item.hasMedia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/media/${item.id}`} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : item.status === "pending" ? (
          <div className="shimmer absolute inset-0 grid place-items-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-brand/60" />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-3.5 pt-9 text-center">
            <span className="text-4xl drop-shadow-sm transition duration-300 group-hover:scale-110">{item.section?.emoji ?? "🗂️"}</span>
            {item.subtopic && <p className="line-clamp-1 rounded-full bg-white/65 px-2.5 py-0.5 text-[12px] font-medium text-ink/75">{item.subtopic}</p>}
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium capitalize text-ink/80 backdrop-blur">
          <Icon className="h-3 w-3" /> {item.kind}
        </span>
        {item.favorite && !onSelect && <Heart className="absolute right-2.5 top-2.5 h-4 w-4 fill-rose-500 text-rose-500 drop-shadow" />}
        {onSelect && (
          <span className={`absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full border-2 transition ${selected ? "border-violet-600 bg-violet-600 text-white" : "border-white bg-white/70"}`}>
            {selected && <Check className="h-3.5 w-3.5" />}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{item.status === "pending" ? "Sorting this save…" : item.title}</h3>
        {item.summary && <p className="line-clamp-2 text-xs leading-relaxed text-muted">{item.summary}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          {showSection && item.section ? (
            <span className="truncate rounded-full px-2 py-0.5 text-[11px] font-medium" style={chipStyle(item.section.slug)}>
              {item.section.emoji} {item.section.name}
            </span>
          ) : (
            <span className="truncate text-[11px] text-muted">{item.author ? `@${item.author}` : ""}</span>
          )}
          <span className="shrink-0 text-[11px] text-muted" suppressHydrationWarning>
            {timeAgo(item.savedAt)}
          </span>
        </div>
      </div>
    </>
  );
  const cls = `lift group flex flex-col overflow-hidden rounded-2xl border bg-white text-left ${selected ? "border-violet-400 ring-2 ring-violet-300" : "border-line"}`;
  if (onSelect)
    return (
      <button type="button" onClick={() => onSelect(item.id)} className={cls}>
        {body}
      </button>
    );
  return (
    <Link href={`/app/saves/${item.id}`} className={cls}>
      {body}
    </Link>
  );
}

export function ItemRow({ item }: { item: ItemView }) {
  return (
    <Link href={`/app/saves/${item.id}`} className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-canvas">
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl text-lg" style={tileStyle(item.section?.slug ?? "x")}>
        {item.hasMedia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/media/${item.id}`} alt="" className="h-full w-full object-cover" />
        ) : (
          item.section?.emoji ?? "🗂️"
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.title}</span>
        <span className="block truncate text-xs text-muted">{[item.section?.name, item.subtopic, item.author && `@${item.author}`].filter(Boolean).join(" · ")}</span>
      </span>
      <span className="shrink-0 text-[11px] text-muted" suppressHydrationWarning>
        {timeAgo(item.savedAt)}
      </span>
    </Link>
  );
}

export function ItemGrid({ items, showSection = true, selected, onSelect }: { items: ItemView[]; showSection?: boolean; selected?: Set<string>; onSelect?: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((i) => (
        <ItemCard key={i.id} item={i} showSection={showSection} selected={selected?.has(i.id)} onSelect={onSelect} />
      ))}
    </div>
  );
}
