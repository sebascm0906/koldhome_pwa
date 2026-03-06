"use server";
import { callKw } from "@/lib/odoo";

export async function getProducts() {
  try {
    const products = await callKw('product.product', 'search_read', [[['sale_ok', '=', true], ['active', '=', true], ['list_price', '>', 0], ['is_published', '=', true]]], {
      fields: ['id', 'name', 'list_price', 'categ_id', 'default_code', 'description_sale', 'image_512'],
      limit: 246 // Fetch all vendible products found in audit
    });
    return products;
  } catch (error) {
    console.error('Error fetching products from Odoo:', error);
    return [];
  }
}
