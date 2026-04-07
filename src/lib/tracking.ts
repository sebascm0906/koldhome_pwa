/**
 * B2C KoldHome — Unified Client-side Tracking v2
 * Fires events to /api/tracking/event for Feature Store persistence
 *
 * v2 changes:
 *   - Adds session_id (persistent per browser tab session)
 *   - Adds source_system ('koldhome_web' or 'koldhome_pwa')
 *   - Adds entry_source detection (bot_redirect, direct_web, recovery, reorder)
 *   - All events share consistent shape for unified event schema v5
 *
 * Events (koldhome_web):
 *   b2c_web_opened        — user landed on web from bot redirect
 *   b2c_checkout_started   — user clicked "Confirmar" in cart
 *   b2c_order_placed_client — order created successfully (client-side)
 *
 * Events (koldhome_pwa):
 *   b2c_pwa_opened         — user opened PWA (not from bot)
 *   b2c_pwa_reorder_started — user began reorder in PWA
 *   b2c_pwa_reorder_completed — user completed reorder in PWA
 *   b2c_pwa_points_viewed  — user viewed loyalty/points page
 *
 * All events are fire-and-forget (non-blocking).
 */

// ============================================================
// Session ID (persistent per tab session, UUID v4)
// ============================================================

function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return '';
  let sid = sessionStorage.getItem('b2c_session_id');
  if (!sid) {
    sid = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('b2c_session_id', sid);
  }
  return sid;
}

// ============================================================
// URL Tracking Params
// ============================================================

export function getTrackingParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  const keys = ['src', 'wa_id', 'combo', 'qty', 'total', 'oid', 'ts',
                'utm_source', 'utm_medium'];
  keys.forEach(k => {
    const v = params.get(k);
    if (v) result[k] = v;
  });
  return result;
}

// ============================================================
// Source Detection
// ============================================================

export function isFromBotRedirect(): boolean {
  const params = getTrackingParams();
  return params.utm_source === 'whatsapp' && params.utm_medium === 'b2c_bot';
}

export function isFromRecovery(): boolean {
  const params = getTrackingParams();
  return params.src === 'recovery';
}

/**
 * Detect entry_source from URL params:
 *   bot_redirect  — utm_source=whatsapp & utm_medium=b2c_bot
 *   recovery      — src=recovery
 *   reorder       — src=reorder
 *   direct_web    — no bot params present
 */
export function detectEntrySource(): string {
  const params = getTrackingParams();
  if (params.utm_source === 'whatsapp' && params.utm_medium === 'b2c_bot') {
    if (params.src === 'recovery') return 'recovery';
    if (params.src === 'reorder') return 'reorder';
    return 'bot_redirect';
  }
  return 'direct_web';
}

/**
 * Detect source_system from context:
 *   koldhome_pwa  — if running as installed PWA (standalone)
 *   koldhome_web  — otherwise
 */
export function detectSourceSystem(): string {
  if (typeof window === 'undefined') return 'koldhome_web';
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  return isStandalone ? 'koldhome_pwa' : 'koldhome_web';
}

// ============================================================
// Dedup Key
// ============================================================

function dedupKey(eventType: string, extra?: string): string {
  const params = getTrackingParams();
  const base = `${eventType}:${params.wa_id || 'anon'}:${params.ts || ''}`;
  return extra ? `${base}:${extra}` : base;
}

// ============================================================
// Core Event Emitter
// ============================================================

export async function trackEvent(
  eventType: string,
  data: Record<string, any> = {},
  options: { dedup?: string } = {}
): Promise<void> {
  try {
    const params = getTrackingParams();
    const payload = {
      event_type: eventType,
      // Identity
      wa_id: params.wa_id || '',
      session_id: getSessionId(),
      // Channel context
      source_system: detectSourceSystem(),
      entry_source: detectEntrySource(),
      // URL tracking params
      source: params.src || 'direct_web',
      combo: params.combo || data.combo || '',
      qty: params.qty || data.qty || '',
      total: params.total || data.total || '',
      order_id: params.oid || data.order_id || '',
      utm_source: params.utm_source || '',
      utm_medium: params.utm_medium || '',
      ts: params.ts || '',
      dedup_key: options.dedup || dedupKey(eventType),
      // Extra data from caller
      ...data,
      // Client metadata
      page_url: typeof window !== 'undefined' ? window.location.pathname : '',
      timestamp: new Date().toISOString(),
    };

    // Fire-and-forget — don't await or block UI
    fetch('/api/tracking/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently fail — tracking should never break the app
    });
  } catch {
    // Never throw from tracking
  }
}

// ============================================================
// Convenience: Web Events
// ============================================================

/** Fire web_opened if from bot redirect (call once on page mount) */
export function trackWebOpened(): void {
  if (!isFromBotRedirect()) return;

  // SessionStorage dedup to avoid double-firing on SPA navigation
  const key = 'b2c_web_opened_' + (getTrackingParams().ts || 'x');
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) return;

  trackEvent('b2c_web_opened', {}, { dedup: dedupKey('b2c_web_opened') });

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(key, '1');
  }
}

/** Fire checkout_started with cart details */
export function trackCheckoutStarted(cartData: {
  items: Array<{ product_id: number; name: string; qty: number; price: number }>;
  total: number;
  payment_method: string;
  delivery_window: string;
}): void {
  const combo = cartData.items.length > 0 ? cartData.items[0].name : '';
  trackEvent('b2c_checkout_started', {
    combo,
    total: cartData.total,
    payment_method: cartData.payment_method,
    delivery_window: cartData.delivery_window,
    item_count: cartData.items.length,
    cart_items: cartData.items.slice(0, 5).map(i => ({
      name: i.name, qty: i.qty, price: i.price,
    })),
  }, { dedup: dedupKey('b2c_checkout_started', String(cartData.total)) });
}

/** Fire order placed (client-side complement to W86) */
export function trackOrderPlaced(orderData: {
  order_name: string;
  total: number;
  delivery_window: string;
}): void {
  trackEvent('b2c_order_placed_client', {
    order_name: orderData.order_name,
    total: orderData.total,
    delivery_window: orderData.delivery_window,
  }, { dedup: dedupKey('b2c_order_placed', orderData.order_name) });
}

// ============================================================
// Convenience: PWA Events
// ============================================================

/** Fire pwa_opened (when user opens PWA directly, not from bot) */
export function trackPwaOpened(): void {
  if (isFromBotRedirect()) return; // Bot redirects are tracked as web_opened
  if (detectSourceSystem() !== 'koldhome_pwa') return;

  const key = 'b2c_pwa_opened_' + new Date().toISOString().slice(0, 10);
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) return;

  trackEvent('b2c_pwa_opened', {
    entry_source: 'pwa_organic',
  }, { dedup: dedupKey('b2c_pwa_opened') });

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(key, '1');
  }
}

/** Fire when user starts a reorder from PWA */
export function trackPwaReorderStarted(orderData: {
  original_order_id?: number;
  items: Array<{ name: string; qty: number }>;
  estimated_total: number;
}): void {
  trackEvent('b2c_pwa_reorder_started', {
    original_order_id: orderData.original_order_id,
    item_count: orderData.items.length,
    estimated_total: orderData.estimated_total,
    entry_source: 'reorder',
  });
}

/** Fire when PWA reorder is completed */
export function trackPwaReorderCompleted(orderData: {
  order_name: string;
  total: number;
  original_order_id?: number;
}): void {
  trackEvent('b2c_pwa_reorder_completed', {
    order_name: orderData.order_name,
    total: orderData.total,
    original_order_id: orderData.original_order_id,
    entry_source: 'reorder',
  }, { dedup: dedupKey('b2c_pwa_reorder', orderData.order_name) });
}

/** Fire when user views loyalty/points page */
export function trackPwaPointsViewed(): void {
  const key = 'b2c_points_viewed_' + new Date().toISOString().slice(0, 10);
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) return;

  trackEvent('b2c_pwa_points_viewed', {});

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(key, '1');
  }
}
