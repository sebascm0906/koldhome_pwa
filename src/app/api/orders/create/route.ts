import { NextResponse } from 'next/server';
import { callKw } from '@/lib/odoo';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart_lines, delivery_window, payment_method, reward_id } = body;

    const cookieStore = await cookies();
    const cookiePid = cookieStore.get('partner_id')?.value;
    const partner_id = cookiePid ? parseInt(cookiePid, 10) : body.partner_id;

    if (!partner_id || !cart_lines || cart_lines.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Format order lines for Odoo (Command 0: Create)
    // We strictly OMIT price_unit so Odoo auto-calculates base price + taxes
    const orderLines = cart_lines.map((line: any) => [
      0,
      0,
      {
        product_id: line.product_id,
        product_uom_qty: line.qty
      }
    ]);

    const orderData: any = {
      partner_id: partner_id,
      company_id: 34,
      x_studio_horario_de_entrega_solicitado: delivery_window,
      x_studio_mtdo_de_pago: payment_method,
      x_studio_canal_origen: "pwa_koldhome",
      order_line: orderLines
    };

    // 2. Create the sale.order in Odoo
    const orderId = await callKw('sale.order', 'create', [orderData]);

    if (!orderId) {
      throw new Error("Failed to create sale.order in Odoo");
    }

    // 3. Apply reward if selected (assuming native Odoo 18 flow allows this via method call)
    // Note: In Odoo 18, applying loyalty rewards often requires calling specific methods
    // For MVP, we pass it but might need a specific action call to claim the reward
    if (reward_id) {
      // Placeholder: We would call action_apply_reward or similar here
      console.log(`Applying reward ${reward_id} to order ${orderId}`);
    }

    // 4. Confirm the order
    await callKw('sale.order', 'action_confirm', [[orderId]]);

    // 5. Fetch the order name (e.g. S00123)
    const orderDetails = await callKw('sale.order', 'search_read', [[['id', '=', orderId]]], {
      fields: ['name'],
      limit: 1
    });

    const orderName = orderDetails.length > 0 ? orderDetails[0].name : `ID: ${orderId}`;
    console.log(`Successfully created and confirmed order ${orderName}`);

    return NextResponse.json({
      success: true,
      order_id: orderId,
      order_name: orderName,
      estimated_delivery: delivery_window
    });

  } catch (error: any) {
    console.error('API /orders/create Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error communicating with Odoo' },
      { status: 500 }
    );
  }
}
