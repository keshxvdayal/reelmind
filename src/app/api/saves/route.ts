import { after } from "next/server";
import { apiUser } from "@/lib/auth";
import { addManualItem, processItem } from "@/lib/ingest";
import { downloadImage, fetchPreview } from "@/lib/instagram";
import { PLANS } from "@/lib/plans";

export const maxDuration = 120;

/** Add a save from the dashboard: an Instagram link, a caption, or both. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = (await req.json().catch(() => ({}))) as { url?: string; caption?: string; note?: string };
  let url = body.url?.trim() || null;
  let caption = body.caption?.trim() ?? "";
  const note = body.note?.trim() ?? "";
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  if (url) {
    try {
      new URL(url);
    } catch {
      return Response.json({ error: "That link doesn't look right." }, { status: 400 });
    }
  }
  if (!url && !caption && !note) return Response.json({ error: "Paste a link, a caption or a note." }, { status: 400 });

  let author: string | null = null;
  let image: { data: Buffer; contentType: string } | null = null;
  if (url && /^https:\/\/(www\.)?instagram\.com\//i.test(url) && !caption) {
    const preview = await fetchPreview(url);
    caption = preview.caption;
    author = preview.author;
    if (preview.image && /^https:\/\/[^/]*(cdninstagram\.com|fbcdn\.net)\//.test(preview.image)) image = await downloadImage(preview.image);
  }

  const item = await addManualItem(user, { url, caption: caption.slice(0, 5000), note: note.slice(0, 1000), author, image });
  if (!item) return Response.json({ error: `Your free plan holds ${PLANS.free.saveLimit} saves. Upgrade to Pro to add more.` }, { status: 402 });
  after(() => processItem(item.id));
  return Response.json({ id: item.id });
}
