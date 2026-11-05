import { apiUser } from "@/lib/auth";
import { createOrder, razorpayConfigured } from "@/lib/billing";

/** Start a Pro purchase: returns a Razorpay order for Checkout, or { dev: true } when payments aren't configured. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { interval } = (await req.json().catch(() => ({}))) as { interval?: string };
  const iv = interval === "month" ? "month" : "year";
  if (!razorpayConfigured()) return Response.json({ dev: true });
  try {
    const order = await createOrder(user.id, iv);
    return Response.json({ ...order, name: user.name, email: user.email });
  } catch (err) {
    console.error("[billing]", err);
    return Response.json({ error: "Couldn't start the payment. Try again in a minute." }, { status: 502 });
  }
}
