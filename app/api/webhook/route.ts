import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { scanUrl } from "@/lib/scanner";
import { sendReport } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;
    const scannedUrl = session.metadata?.scanned_url;

    if (!customerEmail || !scannedUrl) {
      console.error("Missing email or URL in session", session.id);
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    try {
      // Scanner le site
      const result = await scanUrl(scannedUrl);

      // Envoyer le rapport par email
      await sendReport(customerEmail, result);

      console.log(`Report sent to ${customerEmail} for ${scannedUrl}`);
    } catch (err: any) {
      console.error("Error processing report:", err.message);
      return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
