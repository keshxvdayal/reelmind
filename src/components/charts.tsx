/** Small, dependency-free charts. Single series → one hue (violet), text in ink tokens. */

export function MonthBars({ data }: { data: { label: string; month: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const ticks = [max, Math.round(max / 2), 0];
  return (
    <figure>
      <div className="relative flex h-48 gap-[2px] pl-8" role="img" aria-label="Saves per month">
        <div className="pointer-events-none absolute inset-y-0 left-8 right-0 flex flex-col justify-between">
          {ticks.map((t, i) => (
            <div key={i} className="relative border-t border-dashed border-line">
              <span className="absolute -left-8 -top-2 w-6 text-right text-[10px] text-muted">{t}</span>
            </div>
          ))}
        </div>
        {data.map((d) => (
          <div key={d.month} className="group relative flex flex-1 flex-col items-center justify-end">
            <div className="w-full max-w-7 rounded-t-[4px] bg-violet-500 transition group-hover:bg-violet-700" style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 3 : 0 }} />
            <span className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[11px] text-white shadow group-hover:block" style={{ bottom: `${(d.count / max) * 100}%` }}>
              {d.label}: {d.count} save{d.count === 1 ? "" : "s"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[2px] pl-8">
        {data.map((d) => (
          <span key={d.month} className="flex-1 text-center text-[10px] text-muted">
            {d.label}
          </span>
        ))}
      </div>
      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer hover:text-ink">Show as table</summary>
        <table className="mt-2 w-full max-w-xs">
          <tbody>
            {data.map((d) => (
              <tr key={d.month} className="border-b border-line">
                <td className="py-1">{d.month}</td>
                <td className="py-1 text-right font-medium text-ink">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

export function ShareBars({ rows }: { rows: { label: string; value: number; href?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((n, r) => n + r.value, 0) || 1;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="group" title={`${r.label}: ${r.value} (${Math.round((r.value / total) * 100)}%)`}>
          <div className="mb-1 flex items-center justify-between text-[13px]">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 text-muted">
              {r.value} · {Math.round((r.value / total) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-canvas">
            <div className="h-full rounded-full bg-violet-500 transition group-hover:bg-violet-700" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
