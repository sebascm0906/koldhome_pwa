/**
 * B2C KoldHome — Unified Tracking Event API Route v2
 * Receives client-side tracking events and forwards to n8n webhook
 * for persistence in the Feature Store (build_crew.b2c_chatbot_event).
 *
 * Endpoint: POST /api/tracking/event
 *
 * v2 changes:
 *   - Expanded whitelist with PWA events
 *   - Forwards session_id, source_system, entry_source
 *   - Adds user-agent for device context
 *
 * This route acts as a proxy to avoid exposing the n8n webhook URL
 * to the client. It also adds server-side context (partner_id from cookie).
 */
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

const N8N_TRACKING_WEBHOOK = process.env.N8N_TRACKING_WEBHOOK_URL
  || 'https://n8n.grupofrio.mx/webhook/b2c-tracking-event';

// Valid event types (whitelist for security)
const VALID_EVENTS = new Set([
  // Web events
  'b2c_web_opened',
  'b2c_checkout_started',
  'b2c_order_placed_client',
  // PWA events
  'b2c_pwa_opened',
  'b2c_pwa_reorder_started',
  'b2c_pwa_reorder_completed',
  'b2c_pwa_points_viewed',
]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const eventType = body.event_type;

    // Validate event type
    if (!eventType || !VALID_EVENTS.has(eventType)) {
      return NextResponse.json(
        { error: 'Invalid event_type' },
        { status: 400 }
      );
    }

    // Add server-side context
    const cookieStore = await cookies();
    const headerList = await headers();
    const partnerId = cookieStore.get('partner_id')?.value || '';
    const userAgent = headerList.get('user-agent') || '';

    const payload = {
      ...body,
      // Server-enriched identity
      partner_id: partnerId ? parseInt(partnerId, 10) : null,
      // Server-enriched context
      user_agent: userAgent,
      server_timestamp: new Date().toISOString(),
      _action: 'b2c_tracking_event',
    };

    // Forward to n8n webhook (fire-and-forget with timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      await fetch(N8N_TRACKING_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch {
      // Don't fail the request if n8n is unreachable
      console.error('[tracking] n8n webhook unreachable');
    } finally {
      clearTimeout(timeout);
    }

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('[tracking] Error:', error.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
