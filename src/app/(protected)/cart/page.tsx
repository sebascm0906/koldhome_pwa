import Header from "@/components/Header";
import CartClient from "./CartClient";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-background pb-40 flex flex-col">
      <Header title="Tu Pedido" showBack backHref="/home" />
      <CartClient />
    </div>
  );
}
