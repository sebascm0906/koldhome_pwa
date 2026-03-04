export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16' as any,
  });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret!);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const partnerId = paymentIntent.metadata.partner_id;
      const orderRef = paymentIntent.metadata.order_ref;
      
      console.log(`[Stripe Webhook] Payment succeeded for order_ref: ${orderRef}, partner: ${partnerId}`);
      
      // En este flujo el pedido normalmente se creó en estado validación y aquí se confirma
      // o se creó como borrador (estado sale.order) y se cambia a 'sale'.
      if (orderRef) {
        // En Odoo 18, orderRef podría ser el orderId
        // Por seguridad, un action_confirm real
        // await callKw('sale.order', 'action_confirm', [[parseInt(orderRef)]]);
        console.log(`Confirming sale.order in Odoo for ref: ${orderRef}`);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error(`[Stripe Webhook] Payment failed for order_ref: ${paymentIntent.metadata.order_ref}`);
    } else {
      console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook event:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "alive" });
}
