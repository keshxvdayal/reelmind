import Link from "next/link";
import { Fragment } from "react";

export type CatalogEntry = { id: string; title: string; emoji: string; section: string };
export type Catalog = Record<string, CatalogEntry>;

/** Inline: **bold**, *italic*, `code`, and [[save:ID]] chips. */
function inline(text: string, catalog: Catalog, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\[\[save:([a-zA-Z0-9_-]+)\]\]|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${n++}`;
    if (m[1]) {
      const entry = catalog[m[1]];
      out.push(
        entry ? (
          <Link
            key={key}
            href={`/app/saves/${entry.id}`}
            className="mx-0.5 inline-flex max-w-[16rem] items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 align-middle text-[12px] font-medium text-violet-700 transition hover:bg-violet-100"
            title={entry.title}
          >
            <span>{entry.emoji}</span>
            <span className="truncate">{entry.title}</span>
          </Link>
        ) : null,
      );
    } else if (m[2]) out.push(<strong key={key}>{m[2]}</strong>);
    else if (m[3]) out.push(<em key={key}>{m[3]}</em>);
    else if (m[4]) out.push(<code key={key} className="rounded bg-canvas px-1 text-[0.9em]">{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Small markdown renderer for answers: headings, lists, paragraphs. No raw HTML. */
export function Answer({ text, catalog }: { text: string; catalog: Catalog }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      const k = `p${blocks.length}`;
      blocks.push(<p key={k}>{inline(para.join(" "), catalog, k)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const k = `l${blocks.length}`;
      const items = list.items.map((it, i) => <li key={i}>{inline(it, catalog, `${k}-${i}`)}</li>);
      blocks.push(list.ordered ? <ol key={k}>{items}</ol> : <ul key={k}>{items}</ul>);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (h) {
      flushPara();
      flushList();
      const k = `h${blocks.length}`;
      const level = Math.min(h[1].length + 1, 3);
      const content = inline(h[2], catalog, k);
      blocks.push(level === 2 ? <h2 key={k}>{content}</h2> : <h3 key={k}>{content}</h3>);
    } else if (ul || ol) {
      flushPara();
      const ordered = Boolean(ol);
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push((ul ?? ol)![1]);
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else if (/^-{3,}$/.test(line.trim())) {
      flushPara();
      flushList();
      blocks.push(<hr key={`hr${blocks.length}`} className="my-3 border-line" />);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return <div className="prose-answer text-[15px] leading-relaxed text-ink/90">{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
