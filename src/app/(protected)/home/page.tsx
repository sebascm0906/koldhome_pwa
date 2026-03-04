import { getProducts } from "@/lib/actions/products";
import { User, Search, MapPin } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import BottomCartBar from "@/components/BottomCartBar";

import Header from "@/components/Header";

export default async function HomePage() {
  const products = await getProducts();

  const categories = ["Todos", "Fiestas", "Hogar", "Eventos", "Antojo", "Diario"];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      {/* Search & Categories */}
      <div className="px-4 py-2 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="¿Qué se te antoja hoy?" 
            className="w-full h-12 bg-secondary/50 rounded-xl pl-12 pr-4 outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat, i) => (
            <button 
              key={cat}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                i === 0 ? "bg-primary text-white neon-glow" : "bg-secondary text-muted-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>


      {/* Product List */}
      <main className="flex-1 p-4 pb-36">
        <div className="grid grid-cols-2 gap-4">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>

      <BottomCartBar />
    </div>
  );
}
