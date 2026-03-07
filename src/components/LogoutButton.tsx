"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = () => {
        document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "partner_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/");
    };

    return (
        <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-5 hover:bg-secondary/50 transition-all"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-xl text-destructive">
                    <LogOut size={20} />
                </div>
                <span className="font-bold text-sm text-destructive">Cerrar Sesión</span>
            </div>
        </button>
    );
}
