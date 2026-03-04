"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Check if app is already installed
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isAppStandalone);

    if (isAppStandalone) return;

    // Check localStorage if disabled previously
    if (localStorage.getItem('koldhome-pwa-dismissed')) return;

    // Listen for Chrome Android prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    });

    // If iOS and not standalone, show the custom iOS instruction prompt after 3 seconds
    if (isIosDevice && !isAppStandalone) {
      setTimeout(() => setShowPrompt(true), 3000);
    }
  }, []);

  if (!showPrompt || isStandalone) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('koldhome-pwa-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-primary text-white rounded-3xl p-4 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
      <div className="flex-1 space-y-1">
        <h3 className="font-bold text-sm">Instala KoldHome</h3>
        <p className="text-xs opacity-90">
          {isIOS ? 'Toca compartir y luego "Agregar a inicio"' : 'Añádelo a tu celular para pedir más rápido'}
        </p>
      </div>
      {!isIOS && (
        <button onClick={handleInstall} className="bg-white text-primary px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap">
          Instalar
        </button>
      )}
      <button onClick={handleDismiss} className="p-2 -mr-2 bg-black/10 rounded-full">
        <X size={16} />
      </button>
    </div>
  );
}
