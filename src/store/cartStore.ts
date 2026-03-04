import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  qty: number;
  emoji: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: number) => void;
  setQty: (product_id: number, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem: CartItem) => {
        set((state) => {
          const existingItem = state.items.find(i => i.product_id === newItem.product_id);
          if (existingItem) {
            return {
              items: state.items.map(i => 
                i.product_id === newItem.product_id 
                  ? { ...i, qty: i.qty + newItem.qty } 
                  : i
              )
            };
          }
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (product_id: number) => {
        set((state) => ({
          items: state.items.filter(i => i.product_id !== product_id)
        }));
      },

      setQty: (product_id: number, qty: number) => {
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter(i => i.product_id !== product_id) };
          }
          return {
            items: state.items.map(i => 
              i.product_id === product_id ? { ...i, qty } : i
            )
          };
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.qty), 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.qty, 0);
      }
    }),
    {
      name: 'koldhome-cart-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
