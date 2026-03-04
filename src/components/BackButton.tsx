"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button 
      onClick={() => router.back()} 
      className="p-2 -ml-2 rounded-full hover:bg-secondary transition-all"
    >
      <ArrowLeft size={24} />
    </button>
  );
}
