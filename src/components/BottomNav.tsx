"use client";

import { useCartStore } from "@/store/cartStore";
import { Home, ShoppingCart, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const getItemCount = useCartStore(state => state.getItemCount);

  useEffect(() => setMounted(true), []);

  // Hide on checkout/confirmation screens
  if (pathname.includes('/cart') || pathname.includes('/order')) return null;

  const count = mounted ? getItemCount() : 0;

  const tabs = [
    { label: "Inicio", icon: Home, path: "/home" },
    { label: "Carrito", icon: ShoppingCart, path: "/cart", badge: count },
    { label: "Mi Cuenta", icon: User, path: "/account" },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full glass border-t border-border z-40 pb-safe">
      <div className="flex items-center justify-around p-3">
        {tabs.map((tab) => {
          const isActive = pathname.includes(tab.path);
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`flex flex-col items-center justify-center space-y-1 w-16 relative ${
                isActive ? "text-primary neon-text" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <Icon size={24} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-destructive text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
