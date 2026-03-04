"use client";

import { useCartStore } from "@/store/cartStore";
import { getOrderLines } from "@/lib/actions/account";
import { ChevronRight, Loader2, Package, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderCard({ order }: { order: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const clearCart = useCartStore(state => state.clearCart);
  const addItem = useCartStore(state => state.addItem);

  const handleReorder = async () => {
    setLoading(true);
    try {
      // 1. Fetch full details of the order lines from Odoo
      const lines = await getOrderLines(order.order_line as number[]);
      
      // 2. Clear current cart
      clearCart();
      
      // 3. Add items to Zustand store
      lines.forEach((line: any) => {
        addItem({
          product_id: line.product_id[0],
          name: line.name || line.product_id[1],
          price: line.price_unit,
          qty: line.product_uom_qty,
          emoji: "🧊" // Default emoji
        });
      });
      
      // 4. Redirect to cart
      router.push('/cart');
    } catch (error) {
      console.error("Failed to reorder:", error);
      alert("No se pudo cargar el pedido. Intenta de nuevo.");
      setLoading(false);
    }
  };

  const isConfirmed = order.state === 'sale' || order.state === 'done';
  const isCancelled = order.state === 'cancel';

  return (
    <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl text-white ${isCancelled ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
            <Package size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-white">{order.name}</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(order.date_order).toLocaleDateString("es-MX", { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-extrabold text-[#00b4ff]">${order.amount_total.toFixed(2)}</div>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
            isCancelled ? 'bg-destructive/20 text-destructive' : 
            order.state === 'done' ? 'bg-green-500/20 text-green-400' : 'bg-primary/20 text-primary'
          }`}>
            {isCancelled ? 'Cancelado' : order.state === 'done' ? 'Entregado' : 'Confirmado'}
          </span>
        </div>
      </div>
      
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="text-xs text-muted-foreground flex gap-1">
          <span>{order.order_line.length} {order.order_line.length === 1 ? 'item' : 'ítems'}</span>
          <span>•</span>
          <span className="truncate w-32">{order.x_studio_horario_de_entrega_solicitado || "Lo antes posible"}</span>
        </div>
        
        <button 
          onClick={handleReorder}
          disabled={loading || isCancelled}
          className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          <span>Reordenar</span>
        </button>
      </div>
    </div>
  );
}
