const fs = require('fs');

async function checkTaxes() {
    const ODOO_URL = process.env.ODOO_URL;
    const ODOO_DB = process.env.ODOO_DB;
    const ODOO_USER = process.env.ODOO_SERVICE_USER;
    const ODOO_PASS = process.env.ODOO_SERVICE_PASSWORD;

    const authRes = await fetch(`${ODOO_URL}/web/session/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: { db: ODOO_DB, login: ODOO_USER, password: ODOO_PASS }
        })
    });
    const cookie = authRes.headers.get('set-cookie').match(/session_id=([^;]+)/)[1];

    const callKw = async (model, method, args, kwargs = {}) => {
        const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `session_id=${cookie}`
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: { model, method, args, kwargs }
            })
        });
        const data = await res.json();
        return data.result;
    };

    const products = await callKw('product.product', 'search_read', [[['sale_ok', '=', true], ['active', '=', true], ['is_published', '=', true]]], {
        fields: ['id', 'name', 'list_price', 'lst_price', 'taxes_id'],
        limit: 5
    });

    console.log("Products:", JSON.stringify(products, null, 2));

    // If there are taxes, fetch them to see percentages
    let taxIds = [];
    products.forEach(p => {
        if (p.taxes_id) taxIds.push(...p.taxes_id);
    });
    taxIds = [...new Set(taxIds)];

    if (taxIds.length > 0) {
        const taxes = await callKw('account.tax', 'search_read', [[['id', 'in', taxIds]]], {
            fields: ['id', 'name', 'amount', 'amount_type', 'price_include']
        });
        console.log("Taxes:", JSON.stringify(taxes, null, 2));
    }
}

checkTaxes().catch(console.error);
