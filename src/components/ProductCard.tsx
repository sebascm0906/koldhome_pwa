"use client";

import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ProductCard({ product }: { product: any }) {
  const addItem = useCartStore(state => state.addItem);
  const items = useCartStore(state => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItem = items.find(i => i.product_id === product.id);
  const qty = cartItem ? cartItem.qty : 0;

  const handleAdd = () => {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.list_price,
      qty: 1,
      emoji: "🧊" // Defaulting to ice since we don't have images
    });
  };

  const handleRemove = () => {
    if (qty > 1) {
      useCartStore.getState().setQty(product.id, qty - 1);
    } else {
      useCartStore.getState().removeItem(product.id);
    }
  };

  return (
    <div className="bg-card rounded-3xl p-3 flex flex-col space-y-3 relative">
      <div className="aspect-square bg-secondary rounded-2xl relative flex items-center justify-center text-4xl overflow-hidden">
        {product.image_512 ? (
          <Image
            src={`data:image/jpeg;base64,${product.image_512}`}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          "🧊"
        )}
      </div>
      <div className="space-y-1 mt-2">
        <h3 className="text-sm font-bold leading-tight text-white line-clamp-2" title={product.name}>
          {product.name}
        </h3>
        <p className="text-[10px] text-slate-400 uppercase">{product.categ_id[1]}</p>
      </div>

      <div className="flex items-center justify-between pt-2 h-9">
        <span className="font-extrabold text-[#00b4ff] text-lg">${product.list_price}</span>

        {(!mounted || qty === 0) ? (
          <button
            onClick={handleAdd}
            className="bg-primary hover:bg-primary/80 w-8 h-8 rounded-xl flex items-center justify-center text-white neon-glow transition-all"
          >
            <span className="text-lg font-bold">+</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-secondary rounded-xl p-1 border border-border h-8">
            <button
              onClick={handleRemove}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-background text-white font-bold"
            >
              -
            </button>
            <span className="text-sm font-bold w-4 text-center">{qty}</span>
            <button
              onClick={handleAdd}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-primary text-white font-bold"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
