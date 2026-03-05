"use client";

import { useCartStore } from "@/store/cartStore";
import { ArrowLeft, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getLoyaltyRewards } from "@/lib/actions/loyalty";
import { getLoyaltyCard } from "@/lib/actions/account";

import Header from "@/components/Header";

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe Promise outside component to avoid recreation
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function CheckoutForm({ onPaymentSuccess, onPaymentError, isProcessing }: any) {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <div className="bg-secondary/50 p-4 rounded-xl space-y-4">
      <div className="bg-background rounded-md p-3 border border-border">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#fff',
              '::placeholder': { color: '#888' },
              iconColor: '#00b4ff',
            },
            invalid: { color: '#ef4444' },
          }
        }} />
      </div>
    </div>
  );
}

function CartContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState<any[]>([]);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [userPoints, setUserPoints] = useState(0);

  const [deliveryWindow, setDeliveryWindow] = useState("09-12");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");

  const items = useCartStore(state => state.items);
  const setQty = useCartStore(state => state.setQty);
  const clearCart = useCartStore(state => state.clearCart);
  const getTotal = useCartStore(state => state.getTotal);

  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    setMounted(true);
    getLoyaltyRewards().then(setRewards);

    getLoyaltyCard()
      .then(data => setUserPoints(data.points || 0))
      .catch(() => setUserPoints(0));
  }, []);

  if (!mounted) return null;

  const subtotal = getTotal();
  const pointsEarned = Math.floor(subtotal / 10);
  const testPartnerId = 14;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // 1. If paying with Stripe, process payment first
      if (paymentMethod === 'tarjeta') {
        if (!stripe || !elements) {
          throw new Error("Stripe no ha terminado de cargar.");
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error("Elemento de tarjeta no encontrado.");

        const tempOrderRef = `PWA-${Date.now()}`;

        // Create PaymentIntent
        const intentRes = await fetch('/api/payments/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount_cents: Math.round(subtotal * 100),
            partner_id: testPartnerId,
            order_ref: tempOrderRef
          })
        });

        const intentData = await intentRes.json();
        if (!intentRes.ok) throw new Error(intentData.error || 'Error preparando pago');

        // Confirm Card Payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(intentData.client_secret, {
          payment_method: { card: cardElement }
        });

        if (error) {
          throw new Error(error.message || 'Pago rechazado');
        }
      }

      // 2. Create Odoo Order
      const payload = {
        partner_id: testPartnerId,
        delivery_window: deliveryWindow,
        payment_method: paymentMethod === 'tarjeta' ? 'tarjeta_confirmada' : paymentMethod,
        cart_lines: items,
        reward_id: selectedReward?.id
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create order in Odoo');

      clearCart();
      router.push(`/order/confirmed?order_name=${data.order_name}&points=${pointsEarned}&window=${deliveryWindow}`);

    } catch (err: any) {
      alert("Error Checkout: " + err.message);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-6">
        <div className="text-6xl">🛒</div>
        <h2 className="text-2xl font-bold">Tu carrito está vacío</h2>
        <button onClick={() => router.push('/home')} className="text-primary underline font-bold">
          Regresar al catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40 flex flex-col">
      <Header title="Tu Pedido" showBack />

      <main className="p-4 space-y-8">
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Resumen</h2>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.product_id} className="bg-card rounded-2xl p-3 flex gap-4 items-center">
                <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center text-2xl">
                  {item.emoji}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-sm leading-tight text-white">{item.name}</h3>
                  <div className="font-extrabold text-primary text-sm">${item.price}</div>
                </div>
                <div className="flex items-center gap-3 bg-secondary rounded-lg p-1 border border-border">
                  <button onClick={() => setQty(item.product_id, item.qty - 1)} className="p-1">
                    {item.qty === 1 ? <Trash2 size={16} className="text-destructive" /> : <Minus size={16} />}
                  </button>
                  <span className="font-bold w-4 text-center text-sm">{item.qty}</span>
                  <button onClick={() => setQty(item.product_id, item.qty + 1)} className="p-1">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {userPoints >= 100 && rewards.length > 0 && (
          <section className="bg-gradient-to-r from-secondary to-card border border-primary/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white flex gap-2 items-center">
                <span>🎁</span> Tus recompensas (Saldo: {userPoints} pts)
              </h2>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {rewards.map(reward => {
                const canAfford = userPoints >= reward.required_points;
                const isSelected = selectedReward?.id === reward.id;
                return (
                  <button
                    key={reward.id}
                    disabled={!canAfford}
                    onClick={() => setSelectedReward(isSelected ? null : reward)}
                    className={`flex-shrink-0 p-3 rounded-xl border text-left transition-all w-48 ${isSelected ? 'bg-primary border-primary text-white neon-glow'
                      : !canAfford ? 'bg-card border-border opacity-50'
                        : 'bg-card border-border hover:border-primary/50 text-white'
                      }`}
                  >
                    <div className="font-bold text-sm">{reward.description}</div>
                    <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-primary'}`}>{reward.required_points} pts</div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Entrega y Pago</h2>

          <div className="bg-card rounded-2xl p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Horario de entrega</label>
              <select
                value={deliveryWindow}
                onChange={(e) => setDeliveryWindow(e.target.value)}
                className="w-full h-12 bg-secondary border border-border rounded-xl px-4 outline-none text-white focus:ring-1 focus:ring-primary appearance-none"
              >
                <option value="09-12">09:00 AM - 12:00 PM</option>
                <option value="12-15">12:00 PM - 03:00 PM</option>
                <option value="15-18">03:00 PM - 06:00 PM</option>
                <option value="18-21">06:00 PM - 09:00 PM</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Método de pago</label>
              <div className="grid grid-cols-3 gap-2">
                {['efectivo', 'transferencia', 'tarjeta'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`h-10 rounded-lg text-xs font-bold capitalize transition-all border ${paymentMethod === method
                      ? 'bg-primary border-primary text-white neon-glow'
                      : 'bg-secondary border-border text-muted-foreground hover:border-primary/50'
                      }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'tarjeta' && (
              <CheckoutForm />
            )}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full glass rounded-t-3xl p-5 pb-8 space-y-4 z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        <div className="space-y-2 pb-4 border-b border-white/10">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {selectedReward && (
            <div className="flex justify-between text-sm text-primary font-bold">
              <span>Recompensa ({selectedReward.description})</span>
              <span>- Aplicada</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Envío</span>
            <span className="text-green-400 font-bold">Gratis</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-white">${subtotal.toFixed(2)}</span>
            <span className="text-xs text-primary font-medium">Ganarás {pointsEarned} puntos al entregar</span>
          </div>
          <button
            disabled={loading || (paymentMethod === 'tarjeta' && !stripe)}
            onClick={handleCheckout}
            className="bg-primary px-8 h-14 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  if (!stripePromise) {
    return <CartContent />;
  }
  return (
    <Elements stripe={stripePromise}>
      <CartContent />
    </Elements>
  );
}
