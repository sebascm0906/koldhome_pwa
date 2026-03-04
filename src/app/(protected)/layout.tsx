import BottomNav from "@/components/BottomNav";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
        redirect("/");
    }

    const payload = await verifyToken(sessionToken);

    if (!payload || !payload.partner_id || !payload.b2b) {
        redirect("/");
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
            <BottomNav />
        </div>
    );
}