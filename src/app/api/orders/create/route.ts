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

    // 1. Fetch reward if applicable to add as order line
    let rewardDiscount = 0;
    let rewardLine = null;
    let rewardPoints = 0;

    if (reward_id) {
      const rewardSearch = await callKw('loyalty.reward', 'search_read', [[['id', '=', reward_id]]], {
        fields: ['id', 'description', 'reward_type', 'required_points', 'discount', 'discount_max_amount'],
        limit: 1
      });
      if (rewardSearch && rewardSearch.length > 0) {
        const reward = rewardSearch[0];
        rewardPoints = reward.required_points;
        rewardDiscount = reward.discount || 0; // Negative value in Odoo? Assuming positive integer returned

        // Ensure discount is negative for accounting
        const appliedDiscount = rewardDiscount > 0 ? -rewardDiscount : rewardDiscount;

        rewardLine = [
          0,
          0,
          {
            name: `Recompensa: ${reward.description}`,
            product_uom_qty: 1,
            price_unit: appliedDiscount,
            is_reward_line: true
            // Depending on Odoo config we might need product_id of a 'Discount' product, 
            // but sending name and price_unit negative is standard for hybrid manual deduction.
          }
        ];
      }
    }

    // 2. Format order lines for Odoo (Command 0: Create)
    // We strictly OMIT price_unit on normal products so Odoo auto-calculates base price + taxes
    const orderLines: any[] = cart_lines.map((line: any) => [
      0,
      0,
      {
        product_id: line.product_id,
        product_uom_qty: line.qty
      }
    ]);

    if (rewardLine) {
      orderLines.push(rewardLine);
    }

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

    // 4. Manual points deduction (Hybrid approach)
    // We update the loyalty.card balance directly to reflect the reward consumption
    if (reward_id && rewardPoints > 0) {
      console.log(`Deducting ${rewardPoints} points for reward ${reward_id}`);
      try {
        // Find the user's loyalty card for program 2
        const cardSearch = await callKw('loyalty.card', 'search_read', [
          [['partner_id', '=', partner_id], ['program_id', '=', 2]]
        ], { fields: ['id', 'points'], limit: 1 });

        if (cardSearch && cardSearch.length > 0) {
          const card = cardSearch[0];
          const newPoints = Math.max(0, card.points - rewardPoints);

          await callKw('loyalty.card', 'write', [[card.id], {
            points: newPoints
          }]);
          console.log(`Deducted points. Old balance: ${card.points}, New: ${newPoints}`);
        }
      } catch (err) {
        console.error("Failed to deduct points on hybrid approach. You may need to manual adjust. ", err);
      }
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
