const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const ODOO_URL = env.ODOO_URL;
const ODOO_DB = env.ODOO_DB;
const ODOO_USER = env.ODOO_SERVICE_USER;
const ODOO_PASS = env.ODOO_SERVICE_PASSWORD;

console.log(`Connecting to: ${ODOO_URL}`);

let sessionId = null;

async function authenticate() {
  const response = await fetch(`${ODOO_URL}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { db: ODOO_DB, login: ODOO_USER, password: ODOO_PASS }
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(`Odoo Auth Error: ${JSON.stringify(data.error)}`);

  const setCookie = response.headers.get('set-cookie');
  const sessionMatch = setCookie && setCookie.match(/session_id=([^;]+)/);
  if (sessionMatch) {
    sessionId = sessionMatch[1];
    return sessionId;
  }
  throw new Error('Failed to retrieve session_id from Odoo');
}

async function callKw(model, method, args, kwargs = {}) {
  const sid = await authenticate();
  
  const response = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session_id=${sid}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { model, method, args, kwargs }
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(`Odoo RPC Error: ${JSON.stringify(data.error)}`);
  return data.result;
}

(async () => {
    try {
        console.log('Authenticating...');
        const sid = await authenticate();
        console.log('Session ID:', sid ? 'Obtained' : 'Failed');
        
        console.log('Calling search_read for products...');
        const products = await callKw('product.template', 'search_read', [[['sale_ok', '=', true], ['active', '=', true], ['list_price', '>', 0]]], { 
            fields: ['id', 'name', 'list_price', 'categ_id', 'default_code', 'description_sale'],
            limit: 5 
        });
        console.log('Products found:', products.length);
        if (products.length > 0) {
            console.log('First product:', products[0].name, '- $', products[0].list_price);
        }
    } catch (e) {
        console.error('DIAGNOSTIC FAILED:', e.message);
    }
})();
