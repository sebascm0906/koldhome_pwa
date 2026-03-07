const fs = require('fs');

async function testApplyRewardHybrid() {
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
    const cookieMatch = authRes.headers.get('set-cookie')?.match(/session_id=([^;]+)/);
    const cookie = cookieMatch[1];

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
        return data;
    };

    // Hybrid Line Injection Test 
    const rewardLine = [
        0,
        0,
        {
            name: `Recompensa: $30 de descuento híbrida`,
            product_uom_qty: 1,
            price_unit: -30,
            is_reward_line: true
        }
    ];

    const orderData = {
        partner_id: 54913,
        company_id: 34,
        order_line: [
            [0, 0, { product_id: 56, product_uom_qty: 2 }],
            rewardLine
        ]
    };

    try {
        const createRes = await callKw('sale.order', 'create', [orderData]);
        const testOrderId = createRes.result;
        console.log("Created Hybrid Order Id:", testOrderId);

        const finalOrder = await callKw('sale.order', 'search_read', [[['id', '=', testOrderId]]], {
            fields: ['name', 'amount_total', 'order_line']
        });
        console.log("Final Hybrid Order:", finalOrder.result);

        // Wait for check
        await new Promise(r => setTimeout(r, 2000));

        await callKw('sale.order', 'action_cancel', [[testOrderId]]);
        console.log("Canceled!");
    } catch (e) {
        console.error("Hybrid creation failed:", e);
    }
}

testApplyRewardHybrid().catch(console.error);
