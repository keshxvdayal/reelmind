import { apiUser } from "@/lib/auth";
import { activatePlan, verifyPaymentSignature } from "@/lib/billing";
import { readDb } from "@/lib/store";

/** Called by Checkout's success handler. The signature proves Razorpay captured the payment for this order. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = (await req.json().catch(() => ({}))) as { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  if (!orderId || !paymentId || !signature || !verifyPaymentSignature(orderId, paymentId, signature)) {
    return Response.json({ error: "Payment could not be verified." }, { status: 400 });
  }
  const order = (await readDb()).payments.find((p) => p.ref === orderId && p.userId === user.id && p.provider === "razorpay");
  if (!order) return Response.json({ error: "Unknown order." }, { status: 404 });
  if (order.status !== "paid") await activatePlan(user.id, "pro", order.interval, { provider: "razorpay", ref: orderId });
  return Response.json({ ok: true });
}
