const https = require('https');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const ODOO_URL = env.ODOO_URL.replace('https://', '');
const ODOO_DB = env.ODOO_DB;
const ODOO_USER = env.ODOO_SERVICE_USER;
const ODOO_PASS = env.ODOO_SERVICE_PASSWORD;

const request = (path, payload, headers = {}) => new Promise((res, rej) => {
  const req = https.request({
    hostname: ODOO_URL,
    path: path,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    rejectUnauthorized: false
  }, r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => res({ d, headers: r.headers, status: r.statusCode }));
  });
  req.on('error', rej);
  req.write(payload);
  req.end();
});

(async () => {
  try {
    const authRes = await request('/web/session/authenticate', JSON.stringify({
      jsonrpc: '2.0', method: 'call', id: 1, params: { db: ODOO_DB, login: ODOO_USER, password: ODOO_PASS }
    }));
    const sid = authRes.headers['set-cookie'].join(';').match(/session_id=([^;]+)/)[0];
    
    console.log('Searching Odoo for sale.order ID: 7129...');
    
    const orderRes = await request('/web/dataset/call_kw', JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      id: 2,
      params: {
        model: 'sale.order',
        method: 'search_read',
        args: [[['id', '=', 7129]]],
        kwargs: { fields: ['name', 'state', 'partner_id', 'amount_total', 'x_studio_canal_origen', 'x_studio_horario_de_entrega_solicitado', 'x_studio_mtdo_de_pago', 'order_line'], limit: 1 }
      }
    }), { 'Cookie': sid });
    
    const orderData = JSON.parse(orderRes.d).result;
    console.log(JSON.stringify(orderData, null, 2));

  } catch (e) {
    console.error('VERIFICATION FAILED:', e);
  }
})();
