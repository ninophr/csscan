import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { scanUrl } from "@/lib/scanner";
import { sendReport } from "@/lib/mailer";
import { Resend } from "resend";

export const runtime = "nodejs";

async function notifyOwner(session: Stripe.Checkout.Session, scannedUrl: string) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const amount = ((session.amount_total || 0) / 100).toFixed(2);
  const currency = (session.currency || "eur").toUpperCase();
  const customerEmail = session.customer_details?.email || "inconnu";

  await resend.emails.send({
    from: "CSScan <rapport@csscan.io>",
    to: "nino.porphyre@gmail.com",
    subject: `💰 Nouveau paiement CSScan — ${amount} ${currency}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#030712;color:#fff;border-radius:16px">
        <h2 style="color:#34d399;margin:0 0 16px">💰 Nouveau paiement reçu !</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#9ca3af;padding:6px 0">Montant</td><td style="color:#fff;font-weight:700">${amount} ${currency}</td></tr>
          <tr><td style="color:#9ca3af;padding:6px 0">Client</td><td style="color:#fff">${customerEmail}</td></tr>
          <tr><td style="color:#9ca3af;padding:6px 0">Site scanné</td><td style="color:#818cf8">${scannedUrl}</td></tr>
          <tr><td style="color:#9ca3af;padding:6px 0">Session</td><td style="color:#6b7280;font-size:12px">${session.id}</td></tr>
        </table>
      </div>
    `,
  });
}

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

    // Notifier le owner en parallèle (non bloquant)
    notifyOwner(session, scannedUrl).catch(console.error);

    try {
      const result = await scanUrl(scannedUrl);
      await sendReport(customerEmail, result);
      console.log(`Report sent to ${customerEmail} for ${scannedUrl}`);
    } catch (err: any) {
      console.error("Error processing report:", err.message);
      return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
