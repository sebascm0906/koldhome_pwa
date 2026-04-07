"use client";

import { CheckCircle2, Package, Clock, Star, ArrowRight, ListOrdered } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { trackOrderPlaced } from "@/lib/tracking";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderName = searchParams.get("order_name") || "Nuevo Pedido";
  const points = searchParams.get("points") || "0";
  const deliveryWindow = searchParams.get("window") || "lo antes posible";

  // B2C Tracking: order_placed_client
  useEffect(() => {
    trackOrderPlaced({
      order_name: orderName,
      total: 0, // Total not available on confirmation page
      delivery_window: deliveryWindow,
    });
  }, [orderName, deliveryWindow]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-8">
      {/* Success Icon */}
      <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center relative neon-glow">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white">
          <CheckCircle2 size={32} />
        </div>
        <div className="absolute -top-2 -right-2 text-3xl">🧊</div>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">¡Ya quedó!</h1>
        <p className="text-muted-foreground text-lg">Tu pedido está siendo preparado.</p>
      </div>

      {/* Order Details Card */}
      <div className="w-full max-w-sm bg-card rounded-3xl p-6 border border-border space-y-5">
        <div className="flex items-center gap-3">
          <Package className="text-primary" size={20} />
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Número de Pedido</p>
            <p className="font-extrabold text-white text-lg">{orderName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Clock className="text-primary" size={20} />
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Horario de Entrega</p>
            <p className="font-bold text-white tracking-wide">{deliveryWindow}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-xl border border-primary/20">
          <Star className="text-[#00b4ff]" size={20} />
          <div>
            <p className="text-xs text-[#00b4ff] font-bold uppercase tracking-wider">Al entregar ganarás</p>
            <p className="font-bold text-white tracking-wide">+{points} Puntos KoldHome</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3 pt-4">
        <button 
          onClick={() => router.push('/account/orders')}
          className="w-full h-14 bg-secondary text-white font-bold rounded-2xl flex items-center justify-center gap-2 border border-border transition-all hover:bg-secondary/80"
        >
          <ListOrdered size={20} />
          <span>Ver mis pedidos</span>
        </button>
        <button 
          onClick={() => router.push('/home')}
          className="w-full h-14 text-primary font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:underline"
        >
          <span>Hacer otro pedido</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex flex-col items-center justify-center p-6"><div className="text-4xl animate-pulse">🧊</div></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
