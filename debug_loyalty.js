const fs = require('fs');

async function checkLoyaltyCards() {
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

    const partnerId = 54913; // Perfil original Koldhome con numero +52 443 693 0710

    // All loyalty cards for this user
    const cards = await callKw('loyalty.card', 'search_read', [[['partner_id', '=', partnerId]]], {
        fields: ['id', 'points', 'points_display', 'program_id']
    });
    console.log("Loyalty Cards for partner 54913:", cards.result);

    // All loyalty cards ignoring partner to see what program IDs exist
    const allCards = await callKw('loyalty.card', 'search_read', [[]], {
        fields: ['id', 'points', 'partner_id', 'program_id'],
        limit: 5
    });
    console.log("Random cards in system:", allCards.result);
}

checkLoyaltyCards().catch(console.error);
