"use client";

import { useCartStore } from "@/store/cartStore";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BottomCartBar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const getTotal = useCartStore(state => state.getTotal);
  const getItemCount = useCartStore(state => state.getItemCount);

  // Avoid hydration errors with sessionStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const count = getItemCount();
  const total = getTotal();

  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] glass rounded-3xl p-4 flex items-center justify-between z-50">
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
          Ver carrito ({count} {count === 1 ? 'item' : 'ítems'})
        </span>
        <span className="text-xl font-extrabold text-white">${total.toFixed(2)}</span>
      </div>
      <button 
        onClick={() => router.push('/cart')}
        className="bg-primary px-6 h-12 rounded-2xl flex items-center gap-2 text-white font-bold transition-all hover:scale-105 active:scale-95 neon-glow"
      >
        <ShoppingCart size={18} />
        <span>Pedir</span>
      </button>
    </div>
  );
}
