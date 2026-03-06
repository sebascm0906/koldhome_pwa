import { NextResponse } from 'next/server';
import { callKw } from '@/lib/odoo';

export async function POST(req: Request) {
  try {
    const { mobile } = await req.json();

    console.log(`[AUTH] Magic Link requested for: ${mobile}`);

    // Limpiar número para buscar (quitar +, espacios) y espaciarlo con wildcards % para ignorar el formato de Odoo
    const cleanMobile = mobile?.replace(/\D/g, '').slice(-10); // get last 10 digits to be safe
    const wildcardMobile = cleanMobile ? '%' + cleanMobile.split('').join('%') + '%' : '';

    // Buscar al usuario original en Odoo
    let partnerName = "Kolder";
    if (wildcardMobile) {
      const partner = await callKw('res.partner', 'search_read', [
        [
          '|',
          ['phone', 'ilike', wildcardMobile],
          ['mobile', 'ilike', wildcardMobile]
        ]
      ], {
        fields: ['name'],
        order: 'create_date asc', // ensure oldest matching user
        limit: 1
      });

      if (partner && partner.length > 0) {
        partnerName = partner[0].name;
      }
    }

    // Call n8n webhook for WA sending
    await fetch(process.env.N8N_WEBHOOK_BASE + '/webhook/pwa-auth-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mobile: mobile,
        name: partnerName
      })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Link request error:", error);
    return NextResponse.json({ error: 'Failed to request link' }, { status: 500 });
  }
}
