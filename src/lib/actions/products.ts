"use server";
import { callKw } from "@/lib/odoo";

export async function getProducts() {
  try {
    const products = await callKw('product.product', 'search_read', [[['sale_ok', '=', true], ['active', '=', true], ['list_price', '>', 0], ['is_published', '=', true]]], {
      fields: ['id', 'name', 'lst_price', 'categ_id', 'default_code', 'description_sale', 'image_512', 'taxes_id'],
      limit: 246 // Fetch all vendible products found in audit
    });

    // Fetch tax percentages to calculate final net price including taxes
    const allTaxIds = Array.from(new Set(products.flatMap((p: any) => p.taxes_id || [])));
    let taxesMap: Record<number, number> = {};

    if (allTaxIds.length > 0) {
      const taxes = await callKw('account.tax', 'search_read', [[['id', 'in', allTaxIds]]], {
        fields: ['id', 'amount']
      });
      taxes.forEach((t: any) => {
        taxesMap[t.id] = t.amount;
      });
    }

    // Apply the highest tax rate found on each product (ignores duplicates by bad config)
    const formattedProducts = products.map((p: any) => {
      let maxTaxRate = 0;
      if (p.taxes_id && p.taxes_id.length > 0) {
        maxTaxRate = Math.max(...p.taxes_id.map((id: number) => taxesMap[id] || 0));
      }

      // Convert from standard Odoo price to Tax Included Price if needed
      let finalPrice = p.lst_price;
      if (maxTaxRate > 0) {
        finalPrice = finalPrice * (1 + (maxTaxRate / 100));
      }

      // Ceil or round to 2 decimals to avoid weird floating numbers
      return {
        ...p,
        lst_price: Math.round(finalPrice * 100) / 100
      };
    });

    return formattedProducts;
  } catch (error) {
    console.error('Error fetching products from Odoo:', error);
    return [];
  }
}
