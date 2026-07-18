"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-[#040905] flex items-center justify-center font-sans">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/25 animate-pulse">
          GM
        </div>
        <div className="w-24 h-1 bg-[#152e20] rounded-full overflow-hidden relative">
          <div className="h-full bg-primary rounded-full animate-pulse w-full shadow-[0_0_8px_#10b981]" />
        </div>
      </div>
    </div>
  );
}
