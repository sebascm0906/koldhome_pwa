import Header from "@/components/Header";
import { getOrderHistory } from "@/lib/actions/account";
import OrderCard from "@/components/OrderCard";
import { PackageX } from "lucide-react";
import Link from "next/link";

export default async function OrdersPage() {
  const orders = await getOrderHistory();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      <Header title="Mis Pedidos" showBack />

      <main className="p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-muted-foreground">
              <PackageX size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Aún no hay pedidos</h2>
            <p className="text-sm text-muted-foreground">Cuando hagas tu primer pedido con KoldHome, aparecerá aquí.</p>
            <Link href="/home" className="mt-4 bg-primary text-white px-6 py-3 rounded-2xl font-bold transition-all neon-glow">
              Ir al catálogo
            </Link>
          </div>
        ) : (
          orders.map((order: any) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </main>
    </div>
  );
}
