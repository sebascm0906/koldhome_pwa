"use server";
import { callKw } from "@/lib/odoo";

export async function getProducts() {
  try {
    // TODO: cambiar a tag koldhome (id:2) cuando estén asignados en Odoo
    // ['product_tmpl_id.tag_ids', 'in', [2]]
    const products = await callKw('product.product', 'search_read', [[
      ['sale_ok', '=', true],
      ['active', '=', true],
      ['is_published', '=', true],
    ]], {
      fields: ['id', 'name', 'lst_price', 'categ_id', 'default_code', 'description_sale', 'image_512'],
      limit: 300
    });

    // Devolver lst_price directo — precios sin IVA como solicita el negocio
    return products;
  } catch (error) {
    console.error('Error fetching products from Odoo:', error);
    return [];
  }
}
