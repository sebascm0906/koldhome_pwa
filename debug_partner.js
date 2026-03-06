const fs = require('fs');

async function debugPartnerWildcard() {
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

    const phoneQuery = '%' + '4436930710'.split('').join('%') + '%'; // %4%4%3%6%9%3%0%7%1%0%

    const partner1 = await callKw('res.partner', 'search_read', [
        [
            '|',
            ['phone', 'ilike', phoneQuery],
            ['mobile', 'ilike', phoneQuery]
        ]
    ], {
        fields: ['id', 'name', 'phone', 'mobile'],
        order: 'create_date asc',
        limit: 10
    });
    console.log("Wildcard Search Results:", partner1);

}

debugPartnerWildcard().catch(console.error);
