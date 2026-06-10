/**
 * KoldHome Control Tower — funnel emitter (Fase 2).
 *
 * Emite eventos de TOPE DE FUNNEL a Odoo `POST /kold/funnel/web` (first-party,
 * SIN API key). Mapea los eventos internos de la PWA a la whitelist del funnel.
 *
 * Reglas: fire-and-forget, nunca bloquea la UX, nunca lanza, sin PII, sin secretos.
 * El canal lo computa Odoo server-side a partir de `source` ('pwa' | 'web') y UTM.
 *
 * Complementa (no reemplaza) el tracking existente a /api/tracking/event (Feature Store).
 */

const FUNNEL_ENDPOINT = 'https://grupofrio.odoo.com/kold/funnel/web';

// PWA event -> funnel whitelist (solo tope de funnel; conversiones/loyalty se omiten)
const EVENT_MAP: Record<string, string> = {
  b2c_pwa_opened: 'web_visit',
  b2c_web_opened: 'web_visit',
  b2c_pwa_reorder_started: 'cart_started',
  b2c_checkout_started: 'cart_updated',
};

function fday(): string {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch {
    return '0';
  }
}

export interface FunnelContext {
  sessionId: string;
  source: string; // 'pwa' | 'web'
  utm?: Record<string, string>;
  data?: Record<string, any>;
}

/**
 * Emite (si aplica) el evento de funnel mapeado. No-op para eventos fuera del mapa.
 * event_id determinístico -> idempotente en Odoo (no duplica).
 */
export function emitFunnel(eventType: string, ctx: FunnelContext): void {
  try {
    const funnelEvent = EVENT_MAP[eventType];
    if (!funnelEvent) return;
    const sid = ctx.sessionId || '';
    const d = ctx.data || {};
    const ref = String(d.order_id || d.original_order_id || d.combo || 'pwa');
    const eid = `${funnelEvent}:${ctx.source}:${sid}:${ref}:${fday()}`;
    const body = JSON.stringify({
      event: funnelEvent,
      event_id: eid,
      ts: new Date().toISOString(),
      source: ctx.source,
      session_id: sid,
      cart_token: '',
      utm: ctx.utm || {},
      data: {
        path: d.path || (typeof window !== 'undefined' ? window.location.pathname : ''),
        items_count: d.items_count,
        cart_value: d.cart_value,
        product_id: d.product_id,
        occasion_slug: d.occasion_slug,
      },
    });
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(FUNNEL_ENDPOINT, new Blob([body], { type: 'text/plain' }));
    } else if (typeof fetch !== 'undefined') {
      fetch(FUNNEL_ENDPOINT, {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'text/plain' },
        mode: 'cors',
      }).catch(() => {
        /* fire-and-forget */
      });
    }
  } catch {
    /* nunca romper la app */
  }
}
