"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function MagicLinkVerifier() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const phone = searchParams.get("phone");

    if (!token || !phone) {
      setStatus("error");
      setErrorMsg("Enlace inválido. Por favor solicita un nuevo código.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: phone, code: token }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          document.cookie = `session=${data.session_token}; path=/; max-age=604800`;
          if (data.partner_id) {
            document.cookie = `partner_id=${data.partner_id}; path=/; max-age=604800`;
          }
          setStatus("success");
          window.location.href = "/home";
        } else {
          setStatus("error");
          setErrorMsg(data.error || "El enlace expiró o ya fue usado. Solicita uno nuevo.");
        }
      } catch {
        setStatus("error");
        setErrorMsg("Error de conexión. Intenta de nuevo.");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center space-y-6 max-w-md mx-auto w-full">
      {status === "verifying" && (
        <>
          <Loader2 className="animate-spin text-primary w-12 h-12" />
          <h1 className="text-2xl font-bold text-primary italic">Verificando tu acceso 🧊</h1>
          <p className="text-muted-foreground">Un momento, estamos validando tu enlace...</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold text-primary italic">¡Acceso confirmado!</h1>
          <p className="text-muted-foreground">Redirigiendo a tu cuenta...</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="text-5xl">❌</div>
          <h1 className="text-2xl font-bold">Enlace inválido</h1>
          <p className="text-muted-foreground">{errorMsg}</p>
          <a
            href="/"
            className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-lg hover:opacity-90 transition-all flex items-center justify-center"
          >
            Solicitar nuevo enlace
          </a>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center space-y-6">
          <Loader2 className="animate-spin text-primary w-12 h-12" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      }
    >
      <MagicLinkVerifier />
    </Suspense>
  );
}
