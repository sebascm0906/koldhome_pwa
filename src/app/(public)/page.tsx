"use client";

import { useEffect } from "react";
import Image from "next/image";
import { emitPwaLanding } from "@/lib/koldFunnel";

// Número de WhatsApp de KoldHome en formato E.164 sin "+", ej. "5215512345678"
// Configurable vía variable de entorno NEXT_PUBLIC_KOLDHOME_WA_NUMBER
const KOLDHOME_WA_NUMBER =
  process.env.NEXT_PUBLIC_KOLDHOME_WA_NUMBER || "5215540000990";

// Mensaje preescrito que el cliente enviará para iniciar el flujo del Magic Link
const WA_MESSAGE = "Dame mi acceso";

export default function LoginPage() {
  // Control Tower: web_visit (source pwa) al abrir la landing — fire-and-forget
  useEffect(() => { emitPwaLanding(); }, []);

  const waUrl = `https://wa.me/${KOLDHOME_WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-10 flex-1 max-w-md mx-auto w-full">
      <div className="relative w-32 h-32 neon-glow rounded-3xl overflow-hidden">
        <Image
          src="/icons/icon-512x512.png"
          alt="KoldHome Logo"
          fill
          className="object-cover"
        />
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">KoldHome</h1>
        <p className="text-muted-foreground text-lg">Tu hielo y snacks favoritos a un tap.</p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        {/* Botón principal — abre WhatsApp con mensaje preescrito "Dame mi acceso" */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          {/* Ícono WhatsApp */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.85L.057 23.25a.75.75 0 00.918.919l5.438-1.461A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.694 9.694 0 01-4.98-1.374l-.358-.213-3.714.998.985-3.63-.233-.374A9.694 9.694 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
          Solicitar código de acceso
        </a>

        <a
          href="https://www.koldhome.com/registro-de-cliente-kold-home"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-14 bg-secondary text-primary font-bold rounded-2xl text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          Regístrate aquí
        </a>
      </div>

      <p className="text-xs text-center text-muted-foreground/60 px-4">
        Al tocar el botón se abrirá WhatsApp con un mensaje listo para enviar. Recibirás tu enlace de acceso en segundos.
      </p>
    </div>
  );
}
