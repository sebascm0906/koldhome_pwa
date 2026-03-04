export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2023-10-16' as any,
    });
    const { amount_cents, partner_id, order_ref } = await req.json();

    if (!amount_cents || !partner_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a PaymentIntent with the given amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount_cents,
      currency: 'mxn',
      metadata: { 
        partner_id: String(partner_id), 
        order_ref: String(order_ref) 
      },
    });

    return NextResponse.json({ client_secret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating PaymentIntent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
