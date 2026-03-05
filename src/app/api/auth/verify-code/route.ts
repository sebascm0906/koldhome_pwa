import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { mobile, code } = await req.json();

        // Mock MVP Logic: Validates if code is 123456
        console.log(`[AUTH] Verifying code ${code} for mobile: ${mobile}`);

        if (code === '123456') {
            // Here we would normally exchange the code for the JWT
            // In the Mock, we just return success so the frontend sets the cookie
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 401 });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
    }
}
