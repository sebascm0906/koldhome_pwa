import Header from "@/components/Header";
import { getLoyaltyCard } from "@/lib/actions/account";
import { getLoyaltyRewards } from "@/lib/actions/loyalty";
import { Award, ChevronRight, Gift, Info, Star } from "lucide-react";
import Link from "next/link";

export default async function LoyaltyPage() {
  const loyalty = await getLoyaltyCard();
  const rewards = await getLoyaltyRewards();

  const nextLevel = loyalty.level === "Bronce" ? 500 : loyalty.level === "Plata" ? 2000 : 2000;
  const progress = loyalty.level === "Oro" ? 100 : Math.min((loyalty.points / nextLevel) * 100, 100);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      <Header title="Mis Puntos" showBack />

      <main className="p-4 space-y-8">
        {/* Tier Card */}
        <section className={`relative rounded-3xl p-6 text-white overflow-hidden border ${
          loyalty.level === 'Oro' ? 'bg-gradient-to-br from-yellow-600 to-yellow-900 border-yellow-500/50' :
          loyalty.level === 'Plata' ? 'bg-gradient-to-br from-slate-400 to-slate-700 border-slate-300/50' :
          'bg-gradient-to-br from-[#cd7f32] to-[#8b5a2b] border-[#cd7f32]/50'
        }`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Nivel Actual</p>
                <h2 className="text-3xl font-extrabold flex items-center gap-2">
                  {loyalty.level === 'Oro' ? '🥇' : loyalty.level === 'Plata' ? '🥈' : '🥉'} {loyalty.level}
                </h2>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Star size={24} className="text-white" fill="currentColor" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-end gap-1">
                <span className="text-5xl font-extrabold tracking-tighter">{loyalty.points}</span>
                <span className="text-sm font-bold opacity-80 mb-2">pts</span>
              </div>

              {loyalty.level !== "Oro" && (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs font-bold opacity-80">
                    <span>Progreso a {loyalty.level === 'Bronce' ? 'Plata' : 'Oro'}</span>
                    <span>{loyalty.points} / {nextLevel}</span>
                  </div>
                  <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-1000 ease-out" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How to earn */}
        <section className="bg-primary/10 border border-primary/20 rounded-3xl p-5 flex items-start gap-4">
          <div className="p-2 bg-primary/20 text-primary rounded-xl">
            <Info size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-white">¿Cómo ganar puntos?</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              Obtén <strong className="text-primary">10 puntos por cada $100</strong> gastados. Los puntos se abonan automáticamente al recibir tu pedido.
            </p>
          </div>
        </section>

        {/* Rewards */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Gift className="text-primary" size={20} />
            <h2 className="font-bold text-lg text-white">Recompensas KoldHome</h2>
          </div>

          <div className="space-y-3">
            {rewards.length === 0 ? (
              <div className="text-center p-8 text-sm text-muted-foreground bg-card rounded-3xl border border-border">
                No hay recompensas configuradas por el momento.
              </div>
            ) : (
              rewards.map((reward: any) => {
                const canAfford = loyalty.points >= reward.required_points;
                const progressReward = Math.min((loyalty.points / reward.required_points) * 100, 100);

                return (
                  <div key={reward.id} className={`bg-card rounded-3xl p-5 border transition-all ${canAfford ? 'border-primary/50 neon-glow' : 'border-border'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-white text-md">{reward.description}</h3>
                        <p className="text-xs text-primary font-bold bg-primary/10 inline-block px-2 py-1 rounded-md mt-1">
                          Costo: {reward.required_points} pts
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-2xl">
                        🎁
                      </div>
                    </div>

                    {!canAfford ? (
                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground font-medium">
                          <span>Te faltan {reward.required_points - loyalty.points} pts</span>
                          <span>{progressReward.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary/50 rounded-full" style={{ width: `${progressReward}%` }} />
                        </div>
                      </div>
                    ) : (
                      <Link 
                        href={`/cart`} 
                        className="mt-4 w-full h-12 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                      >
                        <span>Aplicar Recompensa</span>
                        <ChevronRight size={18} />
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
