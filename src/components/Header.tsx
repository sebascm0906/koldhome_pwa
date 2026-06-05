import { getLoyaltyCard } from "@/lib/actions/account";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import BackButton from "./BackButton";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export default async function Header({ title, showBack = false, backHref }: HeaderProps) {
  const { points } = await getLoyaltyCard();

  return (
    <header className="sticky top-0 z-50 glass px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && <BackButton href={backHref} />}
        {title && <h1 className="font-bold text-lg">{title}</h1>}
        {!title && !showBack && (
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Hola Kolder</span>
            <div className="text-sm font-extrabold text-white tracking-wide">
              Bienvenido 👋
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/account/loyalty" className="bg-secondary rounded-full px-3 py-1.5 flex items-center gap-2 border border-border hover:border-primary/50 transition-all cursor-pointer">
          <span className="text-primary font-bold">{points}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-[2px]">pts</span>
        </Link>
        <Link href="/account" className="p-2 bg-secondary rounded-full border border-border hover:border-primary/50 transition-all">
          <User size={20} className="text-muted-foreground" />
        </Link>
      </div>
    </header>
  );
}
