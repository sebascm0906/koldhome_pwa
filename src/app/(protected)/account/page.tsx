import Header from "@/components/Header";
import { getPartnerProfile, getLoyaltyCard } from "@/lib/actions/account";
import { ChevronRight, LogOut, Package, Star, MapPin, Phone, User } from "lucide-react";
import Link from "next/link";

export default async function AccountPage() {
  const profile = await getPartnerProfile();
  const loyalty = await getLoyaltyCard();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      <Header title="Mi Cuenta" />

      <main className="p-4 space-y-6">
        {/* Profile Info */}
        <section className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center border-2 border-primary">
            <User size={32} className="text-primary" />
          </div>
          <div className="flex-1 space-y-1 z-10">
            <h2 className="text-lg font-bold text-white">{profile?.name || "Kolder"}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone size={12} />
              <span>{profile?.phone || "Sin teléfono"}</span>
            </div>
            {profile?.street && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin size={12} />
                <span className="truncate w-40">{profile.street}</span>
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        </section>

        {/* Loyalty Quick Access */}
        <Link href="/account/loyalty" className="block">
          <section className="bg-gradient-to-r from-secondary to-background border border-border hover:border-primary/50 transition-all rounded-3xl p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="text-primary" size={20} />
                <h3 className="font-bold text-white tracking-wide">KoldHome Puntos</h3>
              </div>
              <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/30">
                {loyalty.level}
              </div>
            </div>
            
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-white">{loyalty.points}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Saldo Actual</span>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight size={20} />
              </div>
            </div>
          </section>
        </Link>

        {/* Menu Options */}
        <section className="bg-card border border-border rounded-3xl overflow-hidden divide-y divide-border">
          <Link href="/account/orders" className="flex items-center justify-between p-5 hover:bg-secondary/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-xl text-primary">
                <Package size={20} />
              </div>
              <span className="font-bold text-sm text-white">Mis Pedidos</span>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </Link>
          
          <button className="w-full flex items-center justify-between p-5 hover:bg-secondary/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-xl text-destructive">
                <LogOut size={20} />
              </div>
              <span className="font-bold text-sm text-destructive">Cerrar Sesión</span>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
}
