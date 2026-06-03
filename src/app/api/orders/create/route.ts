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
    // Solo enviar product_id y qty — omitir image_512 y otros campos del carrito
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

    // Normalizar método de pago a mayúsculas para Odoo
    const paymentMethodMap: Record<string, string> = {
      efectivo: 'EFECTIVO',
      transferencia: 'TRANSFERENCIA',
      tarjeta: 'TARJETA',
      tarjeta_confirmada: 'TARJETA'
    };
    const normalizedPayment = paymentMethodMap[payment_method?.toLowerCase()] || payment_method?.toUpperCase() || 'EFECTIVO';

    const orderData: any = {
      partner_id: partner_id,
      company_id: 34,
      x_studio_horario_de_entrega_solicitado: delivery_window,
      x_studio_mtodo_de_pago: normalizedPayment,
      x_studio_canal_origen: "pwa_koldhome",
      x_kold_order_source: "pwa_b2c",
      order_line: orderLines
    };

    // 2. Create the sale.order in Odoo
    const orderId = await callKw('sale.order', 'create', [orderData]);

    if (!orderId) {
      throw new Error("Failed to create sale.order in Odoo");
    }

    // 4. Manual points calculation (Hybrid approach)
    // We update the loyalty.card balance directly to reflect the reward consumption and points earned

    // Calculate points earned (1 point per $10 spent on products, ignoring the reward line)
    const subtotalOrigin = cart_lines.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0);
    const earnedPoints = Math.floor(subtotalOrigin / 10);

    try {
      // Find the user's loyalty card for program 2
      let cardSearch = await callKw('loyalty.card', 'search_read', [
        [['partner_id', '=', partner_id], ['program_id', '=', 2]]
      ], { fields: ['id', 'points'], limit: 1 });

      // Auto-create if not exists
      if (!cardSearch || cardSearch.length === 0) {
        const newCardId = await callKw('loyalty.card', 'create', [{
          partner_id: partner_id,
          program_id: 2,
          points: 0
        }]);
        cardSearch = [{ id: newCardId, points: 0 }];
      }

      if (cardSearch && cardSearch.length > 0) {
        const card = cardSearch[0];
        // Calculate new balance: Current Points - Spent Points + Earned Points
        const spentPoints = reward_id ? rewardPoints : 0;
        const newPoints = Math.max(0, card.points - spentPoints) + earnedPoints;

        await callKw('loyalty.card', 'write', [[card.id], {
          points: newPoints
        }]);
        console.log(`Updated points. Old: ${card.points}, Spent: ${spentPoints}, Earned: ${earnedPoints}, New: ${newPoints}`);
      }
    } catch (err) {
      console.error("Failed to update points on hybrid approach. ", err);
    }

    // 4. Confirm the order
    await callKw('sale.order', 'action_confirm', [[orderId]]);

    // 5. Fetch the order name + data needed for payment link
    const orderDetails = await callKw('sale.order', 'search_read', [[['id', '=', orderId]]], {
      fields: ['name', 'amount_total', 'currency_id', 'partner_id'],
      limit: 1
    });

    const orderName = orderDetails.length > 0 ? orderDetails[0].name : `ID: ${orderId}`;
    console.log(`Successfully created and confirmed order ${orderName}`);

    // 6. Generate Stripe payment link if payment method is tarjeta
    let stripe_link: string | null = null;
    if (payment_method?.toLowerCase() === 'tarjeta') {
      try {
        const order = orderDetails[0];
        const wizId = await callKw('payment.link.wizard', 'create', [{
          res_model: 'sale.order',
          res_id: orderId,
          amount: order.amount_total,
          currency_id: order.currency_id[0],
          partner_id: order.partner_id[0],
        }]);
        if (wizId) {
          const wizData = await callKw('payment.link.wizard', 'read', [[wizId]], {
            fields: ['link_url', 'link']
          });
          stripe_link = wizData?.[0]?.link_url || wizData?.[0]?.link || null;
          // Save link on the order
          if (stripe_link) {
            await callKw('sale.order', 'write', [[orderId], { x_stripe_link: stripe_link }]);
          }
        }
      } catch (err) {
        console.error('Error generating payment link:', err);
      }
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      order_name: orderName,
      estimated_delivery: delivery_window,
      stripe_link
    });

  } catch (error: any) {
    console.error('API /orders/create Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error communicating with Odoo' },
      { status: 500 }
    );
  }
}
