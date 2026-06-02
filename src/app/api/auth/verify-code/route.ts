import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { mobile, code } = await req.json();

        console.log(`[AUTH] Verifying code ${code} against n8n for mobile: ${mobile}`);

        const verifyUrl = `${process.env.N8N_WEBHOOK_BASE || 'https://n8n.grupofrio.mx'}/webhook/pwa-auth-verify`;

        // Asegurar que inicie con +52 para N8N (ya que tu webhook exige el +)
        let normalizedPhone = mobile?.replace(/[^\d+]/g, '').trim();

        if (normalizedPhone.length === 10) {
            normalizedPhone = `+52${normalizedPhone}`;
        } else if (normalizedPhone.startsWith('52')) {
            normalizedPhone = `+${normalizedPhone}`;
        } else if (!normalizedPhone.startsWith('+')) {
            normalizedPhone = `+${normalizedPhone}`;
        }

        const n8nRes = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: normalizedPhone,
                token: code
            })
        });

        const n8nData = await n8nRes.json();

        if (n8nRes.ok && n8nData.valid === true) {
            // Forward real JWT session and user info to frontend
            return NextResponse.json({
                success: true,
                session_token: n8nData.session_token,
                partner_id: n8nData.partner_id,
                partner_name: n8nData.partner_name,
                expires_in: n8nData.expires_in
            });
        } else {
            return NextResponse.json(
                { error: n8nData.error || 'Código inválido o expirado' },
                { status: n8nRes.status !== 200 ? n8nRes.status : 401 }
            );
        }

    } catch (error) {
        console.error("N8N Verify Error:", error);
        return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
    }
}
