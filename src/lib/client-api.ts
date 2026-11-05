/** Small fetch wrapper for client components. */
export async function call<T = Record<string, unknown>>(url: string, method: "POST" | "PATCH" | "DELETE" | "GET" = "POST", body?: unknown): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) return { ok: false, error: data.error ?? "Something went wrong." };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Connection lost. Try again." };
  }
}

/** Read an NDJSON stream, calling onEvent for each parsed line. */
export async function readNdjson(res: Response, onEvent: (ev: Record<string, unknown> & { type: string }) => void) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line));
  }
}
