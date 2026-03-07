"use server";
import { callKw } from "@/lib/odoo";

import { cookies } from "next/headers";

async function getPartnerId(): Promise<number> {
  const cookieStore = await cookies();
  const pid = cookieStore.get('partner_id')?.value;
  return pid ? parseInt(pid, 10) : 14;
}

export async function getPartnerProfile() {
  try {
    const partnerId = await getPartnerId();
    const data = await callKw('res.partner', 'search_read', [[['id', '=', partnerId]]], {
      fields: ['name', 'phone', 'street'],
      limit: 1
    });
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching partner:', error);
    return null;
  }
}

export async function getLoyaltyCard() {
  try {
    const partnerId = await getPartnerId();
    let data = await callKw('loyalty.card', 'search_read', [[['partner_id', '=', partnerId], ['program_id', '=', 2]]], {
      fields: ['id', 'points'],
      limit: 1
    });

    if (data.length === 0) {
      // Auto-create card if user doesn't have one for Program 2 yet
      const newCardId = await callKw('loyalty.card', 'create', [{
        partner_id: partnerId,
        program_id: 2,
        points: 0
      }]);
      console.log(`Auto-created Loyalty Card ${newCardId} for Partner ${partnerId}`);

      data = [{ id: newCardId, points: 0 }];
    }

    const points = data.length > 0 ? data[0].points : 0;

    // Determine Level
    let level = "Bronce";
    if (points >= 2000) level = "Oro";
    else if (points >= 500) level = "Plata";

    return { points, level };
  } catch (error) {
    console.error('Error fetching/creating loyalty card:', error);
    return { points: 0, level: "Bronce" };
  }
}

export async function getOrderHistory() {
  try {
    const partnerId = await getPartnerId();
    const data = await callKw('sale.order', 'search_read', [
      [['partner_id', '=', partnerId], ['state', 'in', ['sale', 'done', 'cancel']]]
    ], {
      fields: ['name', 'amount_total', 'state', 'date_order', 'order_line', 'x_studio_horario_de_entrega_solicitado'],
      order: 'date_order desc',
      limit: 20
    });
    return data;
  } catch (error) {
    console.error('Error fetching order history:', error);
    return [];
  }
}

export async function getOrderLines(lineIds: number[]) {
  try {
    const data = await callKw('sale.order.line', 'search_read', [[['id', 'in', lineIds]]], {
      fields: ['product_id', 'product_uom_qty', 'price_unit', 'name']
    });
    return data;
  } catch (error) {
    console.error('Error fetching order lines:', error);
    return [];
  }
}
