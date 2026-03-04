import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { mobile } = await req.json();
    
    // In production, this would call n8n to generate a JWT and send WA
    // For MVP Sprint 1, we just return success
    console.log(`[AUTH] Magic Link requested for: ${mobile}`);
    
    // Simulate n8n webhook call
    /*
    await fetch(process.env.N8N_WEBHOOK_BASE + '/webhook/auth-request', {
        method: 'POST',
        body: JSON.stringify({ mobile })
    });
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to request link' }, { status: 500 });
  }
}
