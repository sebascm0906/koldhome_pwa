"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

function PaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const clearCart = useCartStore(state => state.clearCart);

    const link = searchParams.get("link") || "";
    const orderId = searchParams.get("order_id") || "";
    const orderName = searchParams.get("order_name") || "";
    const amount = searchParams.get("amount") || "";
    const points = searchParams.get("points") || "0";
    const deliveryWindow = searchParams.get("window") || "";

    const [checking, setChecking] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const finishedRef = useRef(false);

    const goConfirmed = () => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        clearCart();
        router.replace(
            `/order/confirmed?order_name=${encodeURIComponent(orderName)}&points=${points}&window=${encodeURIComponent(deliveryWindow)}`
        );
    };

    const checkPaid = async (silent = true): Promise<boolean> => {
        if (!orderId) return false;
        try {
            const res = await fetch(`/api/orders/status?order_id=${orderId}`);
            const data = await res.json();
            if (data.paid) {
                goConfirmed();
                return true;
            }
            if (!silent) alert("Aún no se confirma el pago. Si ya pagaste, espera unos segundos e intenta de nuevo.");
            return false;
        } catch {
            return false;
        }
    };

    // Polling automático del estado de pago
    useEffect(() => {
        if (!orderId) return;
        const interval = setInterval(() => {
            checkPaid(true);
        }, 4000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    if (!link) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <p className="text-muted-foreground">No se encontró el link de pago.</p>
                <button onClick={() => router.push("/cart")} className="text-primary underline font-bold">
                    Regresar al carrito
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header con flecha de regreso */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 glass z-10">
                <button
                    onClick={() => router.push("/cart")}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary text-white hover:opacity-80 transition-all"
                    aria-label="Regresar al carrito"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="font-bold text-white leading-tight">Pago con tarjeta</h1>
                    <p className="text-xs text-muted-foreground">
                        {orderName ? `Pedido ${orderName} · ` : ""}${amount}
                    </p>
                </div>
                <ShieldCheck size={20} className="text-green-400" />
            </div>

            {/* Iframe del pago */}
            <div className="relative flex-1">
                {!iframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background">
                        <Loader2 className="animate-spin text-primary w-10 h-10" />
                        <p className="text-muted-foreground text-sm">Cargando pago seguro...</p>
                    </div>
                )}
                <iframe
                    src={link}
                    title="Pago seguro"
                    className="w-full h-full border-0"
                    onLoad={() => setIframeLoaded(true)}
                    allow="payment"
                />
            </div>

            {/* Acciones inferiores */}
            <div className="px-4 py-3 border-t border-white/10 glass space-y-2">
                <button
                    onClick={async () => {
                        setChecking(true);
                        await checkPaid(false);
                        setChecking(false);
                    }}
                    disabled={checking}
                    className="w-full h-12 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {checking ? <Loader2 className="animate-spin" size={18} /> : "Ya completé el pago"}
                </button>
                <button
                    onClick={() => router.push("/cart")}
                    className="w-full h-10 text-muted-foreground text-sm underline"
                >
                    Cancelar y regresar al pedido
                </button>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense
            fallback={
                <div className="flex-1 flex items-center justify-center pt-20">
                    <Loader2 className="animate-spin text-primary w-12 h-12" />
                </div>
            }
        >
            <PaymentContent />
        </Suspense>
    );
}
