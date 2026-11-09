import { Flame, Target, Timer, Trophy } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import type { HeatCell } from "@/lib/habits";

const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4);
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

/** Contribution-style grid of saves per day. Columns are weeks (Mon→Sun). */
export function Heatmap({ cols }: { cols: HeatCell[][] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex gap-2">
        <div className="mt-5 grid grid-rows-7 gap-1 text-[10px] leading-[16px] text-muted">
          {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((d, i) => (
            <span key={i} className="h-[16px]">
              {d}
            </span>
          ))}
        </div>
        <div>
          <div className="mb-1 flex h-4 gap-1 text-[10px] text-muted">
            {cols.map((col, i) => {
              const first = col[0].date;
              const show = i === 0 || first.slice(5, 7) !== cols[i - 1][0].date.slice(5, 7);
              return (
                <span key={i} className="w-[16px] overflow-visible whitespace-nowrap">
                  {show ? MONTH.format(new Date(`${first}T00:00:00Z`)) : ""}
                </span>
              );
            })}
          </div>
          <div className="flex gap-1">
            {cols.map((col, i) => (
              <div key={i} className="grid grid-rows-7 gap-1">
                {col.map((c) => (
                  <span key={c.date} title={`${c.date}: ${c.count} save${c.count === 1 ? "" : "s"}`} className={`h-[16px] w-[16px] rounded-[4px] ${c.future ? "bg-transparent" : `heat-${level(c.count)}`}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted">
        Less {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`h-[11px] w-[11px] rounded-[3px] heat-${l}`} />)} More
      </div>
    </div>
  );
}

export type HabitsData = {
  cols: HeatCell[][];
  streak: { current: number; longest: number };
  rhythm: { byDay: { label: string; count: number }[]; parts: { label: string; hint: string; count: number }[]; topDay: string; topPart: string };
  follow: { total: number; done: number; rate: number; recent: number };
};

export function HabitsPanel({ data }: { data: HabitsData }) {
  const { cols, streak, rhythm, follow } = data;
  const maxDay = Math.max(1, ...rhythm.byDay.map((d) => d.count));
  const total = cols.flat().reduce((a, c) => a + c.count, 0);
  const activeDays = cols.flat().filter((c) => c.count > 0).length;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Flame, label: "Current streak", value: `${streak.current} day${streak.current === 1 ? "" : "s"}`, hint: streak.current ? "Keep it going today" : "Save something to start one", tone: "text-orange-500" },
          { icon: Trophy, label: "Longest streak", value: `${streak.longest} day${streak.longest === 1 ? "" : "s"}`, hint: "Your personal best", tone: "text-amber-500" },
          { icon: Target, label: "Follow-through", value: `${follow.rate}%`, hint: `${follow.done} of ${follow.total} try-list items done`, tone: "text-emerald-500" },
          { icon: Timer, label: "Peak time", value: rhythm.topPart, hint: `Most saves on ${rhythm.topDay}s`, tone: "text-violet-500" },
        ].map(({ icon: Icon, label, value, hint, tone }) => (
          <Card key={label} className="p-4">
            <p className="flex items-center justify-between text-xs font-medium text-muted">
              {label} <Icon className={`h-4 w-4 ${tone}`} />
            </p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-0.5 text-xs text-muted">{hint}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-6">
          <SectionTitle title="Saving habit" hint={`${total} saves on ${activeDays} days · last 26 weeks`} />
          <Heatmap cols={cols} />
        </Card>
        <Card className="p-6">
          <SectionTitle title="When you save" />
          <div className="flex h-32 items-end gap-2">
            {rhythm.byDay.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted">{d.count || ""}</span>
                <div className="brand-gradient w-full rounded-md opacity-90" style={{ height: `${Math.max(4, (d.count / maxDay) * 88)}px` }} />
                <span className="text-[11px] text-muted">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {rhythm.parts.map((p) => (
              <div key={p.label} className={`rounded-xl px-3 py-2 ${p.label === rhythm.topPart ? "bg-violet-50 ring-1 ring-violet-200" : "bg-canvas"}`}>
                <p className="text-xs font-semibold">{p.label}</p>
                <p className="text-[11px] text-muted">
                  {p.count} · {p.hint}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
