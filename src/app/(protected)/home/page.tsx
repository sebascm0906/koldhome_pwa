import { getProducts } from "@/lib/actions/products";
import BottomCartBar from "@/components/BottomCartBar";
import Header from "@/components/Header";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const products = await getProducts();

  const categorySet = new Set<string>();
  products.forEach((p: any) => {
    if (p.categ_id && p.categ_id[1]) {
      const parts = p.categ_id[1].split("/");
      const childCategory = parts[parts.length - 1].trim();
      if (childCategory) {
        categorySet.add(childCategory);
      }
    }
  });

  const categories = ["Todos", ...Array.from(categorySet)];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <HomeClient products={products} categories={categories} />
      <BottomCartBar />
    </div>
  );
}
