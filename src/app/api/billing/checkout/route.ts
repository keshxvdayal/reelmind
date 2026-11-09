import { apiUser } from "@/lib/auth";
import { createOrder, razorpayConfigured } from "@/lib/billing";
import { getCurrency, isCurrency } from "@/lib/locale";

/** Start a purchase: returns a Razorpay order for Checkout, or { dev: true } when payments aren't configured. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = (await req.json().catch(() => ({}))) as { plan?: string; interval?: string; currency?: string };
  const plan = body.plan === "premium" ? "premium" : "pro";
  const interval = body.interval === "month" ? "month" : "year";
  const currency = isCurrency(body.currency) ? body.currency : await getCurrency();
  if (!razorpayConfigured()) return Response.json({ dev: true, plan, interval, currency });
  try {
    const order = await createOrder(user.id, plan, interval, currency);
    return Response.json({ ...order, plan, interval, name: user.name, email: user.email });
  } catch (err) {
    console.error("[billing]", err);
    return Response.json({ error: "Couldn't start the payment. Try again in a minute." }, { status: 502 });
  }
}
