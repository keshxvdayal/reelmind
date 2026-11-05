"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, MapPin, Search } from "lucide-react";
import { Card, input } from "@/components/ui";

export type PlaceRow = { name: string; count: number; sections: string[]; saves: { id: string; title: string }[] };

export function PlacesView({ places }: { places: PlaceRow[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(places[0]?.name ?? null);
  const shown = useMemo(() => places.filter((p) => !q.trim() || p.name.toLowerCase().includes(q.toLowerCase())), [places, q]);
  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className={`${input} pl-10`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a city, café, beach…" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => {
          const isOpen = open === p.name;
          return (
            <Card key={p.name} className={`p-4 transition ${isOpen ? "ring-2 ring-violet-300" : ""}`}>
              <button onClick={() => setOpen(isOpen ? null : p.name)} className="flex w-full items-start gap-3 text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500">
                  <MapPin className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {p.count} save{p.count === 1 ? "" : "s"} · {p.sections.join(", ")}
                  </span>
                </span>
              </button>
              {isOpen && (
                <div className="rise mt-3 space-y-1.5 border-t border-line pt-3">
                  {p.saves.map((s) => (
                    <Link key={s.id} href={`/app/saves/${s.id}`} className="block truncate rounded-lg px-2 py-1 text-sm hover:bg-canvas">
                      {s.title}
                    </Link>
                  ))}
                  <a href={`https://www.google.com/maps/search/${encodeURIComponent(p.name)}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 px-2 text-sm font-medium text-brand">
                    Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
