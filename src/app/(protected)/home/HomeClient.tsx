"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import ProductCard from "@/components/ProductCard";

export default function HomeClient({ products, categories }: { products: any[], categories: string[] }) {
    const [activeCategory, setActiveCategory] = useState("Todos");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProducts = products.filter(p => {
        // Math category
        let matchesCategory = true;
        if (activeCategory !== "Todos") {
            if (p.categ_id && p.categ_id[1]) {
                const parts = p.categ_id[1].split("/");
                const childCategory = parts[parts.length - 1].trim();
                matchesCategory = childCategory === activeCategory;
            } else {
                matchesCategory = false;
            }
        }

        // Match search query
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    return (
        <>
            {/* Search & Categories */}
            <div className="px-4 py-2 space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="¿Qué se te antoja hoy?"
                        className="w-full h-12 bg-secondary/50 rounded-xl pl-12 pr-4 outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === cat ? "bg-primary text-white neon-glow" : "bg-secondary text-muted-foreground"
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
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product: any) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <div className="col-span-2 text-center text-muted-foreground py-10 font-medium">
                            No se encontraron productos en esta categoría o búsqueda.
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
