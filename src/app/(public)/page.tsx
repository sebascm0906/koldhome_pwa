"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call to n8n/magic link
    try {
      // Obtenemos link y simulamos la cookie temporal para no quedarnos bloqueados
      const res = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });

      if (res.ok) setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, code })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        document.cookie = `session=${data.session_token}; path=/; max-age=604800`;
        window.location.href = "/home";
      } else {
        setErrorMsg(data.error || "Código incorrecto, intenta de nuevo.");
      }
    } catch (err) {
      setErrorMsg("Ocurrió un error en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-6 flex-1 max-w-md mx-auto w-full">
        <h1 className="text-3xl font-bold text-primary italic">Verifica tu número 🧊</h1>
        <p className="text-muted-foreground">Enviamos un código numérico a tu WhatsApp.</p>

        <form onSubmit={handleVerify} className="w-full space-y-6">
          <div className="space-y-2">
            <input
              autoFocus
              type="text"
              maxLength={6}
              placeholder="Ingresa los 6 dígitos"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={`w-full h-14 bg-secondary border-2 ${errorMsg ? 'border-destructive' : 'border-transparent'} rounded-2xl text-center text-3xl tracking-widest focus:ring-2 focus:ring-primary outline-none transition-all`}
            />
            {errorMsg && <p className="text-sm font-bold text-destructive">{errorMsg}</p>}
          </div>

          <button
            disabled={loading || code.length !== 6}
            className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Verificar y Entrar"}
          </button>
        </form>

        <button
          disabled={loading}
          onClick={() => {
            setSent(false);
            setCode("");
            setErrorMsg("");
          }}
          className="text-primary underline text-sm pt-4"
        >
          No recibí el código, intentar otro número
        </button>
      </div>
    );
  }

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

      <form onSubmit={handleLogin} className="w-full space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground ml-1">Número de WhatsApp</label>
          <input
            type="tel"
            placeholder="Ej. 5512345678"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full h-14 bg-secondary border-none rounded-2xl px-5 text-lg placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>

        <button
          disabled={loading || !mobile}
          className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Solicitar link de acceso"}
        </button>
      </form>

      <p className="text-xs text-center text-muted-foreground/60 px-4">
        Al continuar, aceptas recibir un mensaje de WhatsApp para validar tu identidad. No compartiremos tu número.
      </p>
    </div>
  );
}
