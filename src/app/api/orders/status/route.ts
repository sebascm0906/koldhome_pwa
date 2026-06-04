import { NextResponse } from 'next/server';
import { callKw } from '@/lib/odoo';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = parseInt(searchParams.get('order_id') || '', 10);

    if (!orderId) {
      return NextResponse.json({ error: 'order_id requerido' }, { status: 400 });
    }

    const orders = await callKw('sale.order', 'read', [[orderId], ['transaction_ids', 'amount_paid', 'amount_total']]);
    const order = orders?.[0];
    if (!order) {
      return NextResponse.json({ paid: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    let paid = false;

    // 1. Verificar transacciones de pago en estado done/authorized
    const txIds: number[] = order.transaction_ids || [];
    if (txIds.length > 0) {
      const txs = await callKw('payment.transaction', 'read', [txIds, ['state']]);
      paid = (txs || []).some((t: any) => t.state === 'done' || t.state === 'authorized');
    }

    // 2. Fallback: monto pagado cubre el total
    if (!paid && order.amount_paid && order.amount_total) {
      paid = order.amount_paid >= order.amount_total - 0.01;
    }

    return NextResponse.json({ paid });
  } catch (error: any) {
    console.error('API /orders/status Error:', error);
    return NextResponse.json({ paid: false, error: error.message || 'Error' }, { status: 500 });
  }
}
