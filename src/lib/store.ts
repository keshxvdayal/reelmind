import { randomBytes, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { Db } from "@/lib/types";

/**
 * JSON-file store: ./data/db.json plus downloaded media under ./data/media/<itemId>.
 * Writes are serialized through one promise chain, so it is safe inside one
 * Node process. Move to Postgres + object storage before running more than
 * one server instance.
 */
export const DATA_DIR = process.env.REELMIND_DATA_DIR ?? path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const MEDIA_DIR = path.join(DATA_DIR, "media");

export const emptyDb = (): Db => ({
  version: 1,
  users: [],
  sessions: [],
  sections: [],
  items: [],
  chats: [],
  webhookLog: [],
  collections: [],
  plans: [],
  todos: [],
  reminders: [],
  payments: [],
  contacts: [],
});

let queue: Promise<unknown> = Promise.resolve();

export async function readDb(): Promise<Db> {
  try {
    return { ...emptyDb(), ...(JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Db) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return emptyDb();
    throw err;
  }
}

async function writeDb(db: Db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db));
  await fs.rename(tmp, DB_FILE);
}

/** Read-modify-write transaction. Only one runs at a time; keep slow work (AI calls) outside. */
export function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await writeDb(db);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export async function saveMedia(itemId: string, data: Buffer, contentType: string) {
  await fs.mkdir(MEDIA_DIR, { recursive: true });
  await fs.writeFile(path.join(MEDIA_DIR, itemId), data);
  await fs.writeFile(path.join(MEDIA_DIR, `${itemId}.type`), contentType);
}

export async function readMedia(itemId: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (!/^[a-zA-Z0-9_-]+$/.test(itemId)) return null;
  try {
    const [data, contentType] = await Promise.all([
      fs.readFile(path.join(MEDIA_DIR, itemId)),
      fs.readFile(path.join(MEDIA_DIR, `${itemId}.type`), "utf8"),
    ]);
    return { data, contentType };
  } catch {
    return null;
  }
}

export async function deleteMedia(itemId: string) {
  await Promise.all([
    fs.rm(path.join(MEDIA_DIR, itemId), { force: true }),
    fs.rm(path.join(MEDIA_DIR, `${itemId}.type`), { force: true }),
  ]);
}

export const newId = () => randomUUID().replaceAll("-", "").slice(0, 12);
export const newToken = () => randomBytes(24).toString("base64url");

/** Human-friendly link code, no ambiguous characters (0/O, 1/I/L). */
export function newLinkCode(): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = randomBytes(6);
  return "RM-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function logWebhook(db: Db, kind: string, detail: string) {
  db.webhookLog.push({ at: new Date().toISOString(), kind, detail: detail.slice(0, kind.startsWith("reply:") ? 2000 : 400) });
  if (db.webhookLog.length > 200) db.webhookLog.splice(0, db.webhookLog.length - 200);
}
