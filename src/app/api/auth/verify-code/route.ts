import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { mobile, code } = await req.json();

        console.log(`[AUTH] Verifying code ${code} against n8n for mobile: ${mobile}`);

        const verifyUrl = `${process.env.N8N_WEBHOOK_BASE || 'https://car12los023.app.n8n.cloud'}/webhook/pwa-auth-verify`;

        // Limpiar para N8N que requiere match exacto
        let normalizedPhone = mobile?.replace(/\D/g, '').trim();
        // Si el cliente tipeó "4436930710" (10 dígitos en MX), N8N usualmente espera "524436930710"
        if (normalizedPhone.length === 10 && !normalizedPhone.startsWith('52')) {
            normalizedPhone = `52${normalizedPhone}`;
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
