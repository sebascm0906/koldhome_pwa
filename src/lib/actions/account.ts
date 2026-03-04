"use server";
import { callKw } from "@/lib/odoo";

// Hardcoded for MVP since magic link sets JWT but we don't have a real session yet
const TEST_PARTNER_ID = 14; 

export async function getPartnerProfile() {
  try {
    const data = await callKw('res.partner', 'search_read', [[['id', '=', TEST_PARTNER_ID]]], {
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
    const data = await callKw('loyalty.card', 'search_read', [[['partner_id', '=', TEST_PARTNER_ID], ['program_id', '=', 2]]], {
      fields: ['id', 'points'],
      limit: 1
    });
    
    const points = data.length > 0 ? data[0].points : 0;
    
    // Determine Level
    let level = "Bronce";
    if (points >= 2000) level = "Oro";
    else if (points >= 500) level = "Plata";
    
    return { points, level };
  } catch (error) {
    console.error('Error fetching loyalty card:', error);
    return { points: 0, level: "Bronce" };
  }
}

export async function getOrderHistory() {
  try {
    const data = await callKw('sale.order', 'search_read', [
      [['partner_id', '=', TEST_PARTNER_ID], ['state', 'in', ['sale', 'done', 'cancel']]]
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
