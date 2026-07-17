"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDbStore } from "@/store/dbStore";
import { SystemRole } from "@/types";
import { Sparkles, Shield, User, Eye, Leaf } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { users, switchSessionRole } = useDbStore();
  const [selectedRole, setSelectedRole] = React.useState<SystemRole>("Admin");
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    setTimeout(() => {
      switchSessionRole(selectedRole);
      router.push("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070e0a] font-sans relative overflow-hidden p-4">
      {/* Background Graphic Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />

      {/* Main Login Frame */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#0c1811] border border-[#162f21] rounded-2xl p-8 shadow-2xl flex flex-col items-center relative z-10"
      >
        {/* Brand Logo */}
        <div className="w-12 h-12 rounded-xl bg-[#10b981] flex items-center justify-center text-[#042f1a] font-black text-xl shadow-lg shadow-[#10b981]/15 mb-4">
          GM
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[#f0f7f2]">
          Welcome to Grow<span className="text-[#10b981]">Matrix</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1 mb-8">
          Transforming Data into Decisions
        </p>

        <form onSubmit={handleLogin} className="w-full space-y-6">
          {/* Email / Username Inputs */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Business Email Address
            </label>
            <input
              type="email"
              disabled
              value={
                selectedRole === "Admin" 
                  ? "laxman.bhatiya@growindigo.co.in" 
                  : selectedRole === "Analyst" 
                  ? "analyst@growindigo.co.in" 
                  : "viewer@growindigo.co.in"
              }
              className="w-full bg-[#0c1811] border border-[#162f21] rounded-lg px-3 py-2 text-xs text-muted-foreground focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* Quick Switch Persona Picker */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Quick Switch Login Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Admin", "Analyst", "Viewer"] as SystemRole[]).map((role) => {
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all duration-150 ${
                      isSelected 
                        ? "bg-[#10b981]/10 border-[#10b981] text-[#10b981] font-semibold" 
                        : "bg-[#0c1811] border-[#162f21] text-muted-foreground hover:bg-[#152e20]/30"
                    }`}
                  >
                    {role === "Admin" && <Shield size={14} className="mb-1" />}
                    {role === "Analyst" && <Sparkles size={14} className="mb-1" />}
                    {role === "Viewer" && <Eye size={14} className="mb-1" />}
                    <span className="text-[10px]">{role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Submit Trigger */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#10b981] hover:bg-[#10b981]/95 disabled:bg-[#152e20] text-[#042f1a] font-bold rounded-lg text-xs shadow-sm transition-all duration-150"
          >
            {isLoggingIn ? (
              <span className="w-4 h-4 rounded-full border-2 border-[#042f1a]/20 border-t-[#042f1a] animate-spin" />
            ) : (
              <>
                <Leaf size={13} />
                <span>Sign In to Workspace</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-[10px] text-muted-foreground border-t border-[#162f21] pt-4 w-full">
          Grow Indigo Enterprise Security Matrix Gate
        </div>
      </motion.div>
    </div>
  );
}
