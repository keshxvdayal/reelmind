import { cookies, headers } from "next/headers";
import { CURRENCIES, type Currency } from "@/lib/types";

export const CURRENCY_COOKIE = "rm_currency";
export const TZ_COOKIE = "rm_tz";

const EURO = new Set(["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"]);

export const isCurrency = (v: unknown): v is Currency => typeof v === "string" && (CURRENCIES as readonly string[]).includes(v);

function fromCountry(cc: string | null | undefined): Currency | null {
  if (!cc) return null;
  const c = cc.toUpperCase();
  if (c === "IN") return "INR";
  if (c === "GB") return "GBP";
  if (EURO.has(c)) return "EUR";
  return "USD";
}

/** Region from the first Accept-Language tag, e.g. "en-GB" → "GB". */
function fromLanguage(header: string | null): Currency | null {
  const tag = header?.split(",")[0]?.trim();
  if (!tag) return null;
  const [lang, region] = tag.split("-");
  if (region) return fromCountry(region);
  if (lang === "hi") return "INR";
  if (["de", "fr", "es", "it", "nl", "pt", "fi", "el", "et", "lv", "lt", "sk", "sl", "mt"].includes(lang)) return "EUR";
  return null;
}

/**
 * The visitor's billing currency: their own choice (cookie), else the CDN's
 * country header, else their browser language, else USD.
 */
export async function getCurrency(): Promise<Currency> {
  const chosen = (await cookies()).get(CURRENCY_COOKIE)?.value;
  if (isCurrency(chosen)) return chosen;
  const h = await headers();
  return fromCountry(h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry")) ?? fromLanguage(h.get("accept-language")) ?? "USD";
}

/** The browser's IANA time zone (set by the dashboard on load), UTC until known. */
export async function getTimeZone(): Promise<string> {
  const tz = (await cookies()).get(TZ_COOKIE)?.value;
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}
