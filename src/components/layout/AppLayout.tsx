"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { CommandPalette } from "./CommandPalette";
import { UnauthorizedView } from "./UnauthorizedView";
import { usePermissions } from "@/hooks/usePermissions";
import { useDbStore } from "@/store/dbStore";
import { motion, AnimatePresence } from "framer-motion";

// Maps routes to their required RBAC permissions features
const ROUTE_FEATURE_MAP: Record<string, string> = {
  "/": "dashboard",
  "/datasets": "datasets",
  "/charts": "dashboard",
  "/reports": "report_builder",
  "/reports/builder": "report_builder",
  "/dashboards/builder": "dashboard_builder",
  "/users": "users",
  "/roles": "roles",
  "/settings": "settings",
  "/profile": "dashboard",
  "/notifications": "dashboard"
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasReadAccess } = usePermissions();
  const { 
    fetchDatasets, 
    fetchRelationships, 
    fetchReports, 
    fetchDashboards, 
    fetchUsers, 
    fetchRolePermissions, 
    fetchCurrentUser 
  } = useDbStore();

  const [showSplash, setShowSplash] = React.useState(false);

  // Load all registries, configurations, and permissions from backend API on mount
  React.useEffect(() => {
    fetchDatasets();
    fetchRelationships();
    fetchReports();
    fetchDashboards();
    fetchUsers();
    fetchRolePermissions();
    fetchCurrentUser();
  }, []);

  React.useEffect(() => {
    const shown = sessionStorage.getItem("growmatrix_splash_shown");
    if (!shown) {
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("growmatrix_splash_shown", "true");
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Resolve permission identifier for active path
  const getRequiredFeature = (path: string): string => {
    // Exact match check first
    if (ROUTE_FEATURE_MAP[path]) return ROUTE_FEATURE_MAP[path];

    // Dynamic routes fallback
    if (path.startsWith("/datasets/")) return "datasets";
    if (path.startsWith("/reports/")) return "report_builder";

    return "dashboard"; // Fallback
  };

  const featureId = getRequiredFeature(pathname);
  const isAuthorized = hasReadAccess(featureId);

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-background text-foreground">
      {/* Resizable Collapsible Navigation Sidebar */}
      <React.Suspense fallback={<div className="w-16 md:w-64 bg-card border-r border-border h-screen animate-pulse" />}>
        <Sidebar />
      </React.Suspense>

      {/* Main Content Spliter */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <TopNav />

        {/* Dynamic Display Area */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <AnimatePresence mode="wait">
            {!isAuthorized ? (
              <motion.div
                key="unauthorized"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                <UnauthorizedView />
              </motion.div>
            ) : (
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Global Keyboard Shortcut Command palette */}
      <CommandPalette />

      {/* First Load Splash Screen Overlay */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#070e0a] font-sans"
          >
            <div className="flex flex-col items-center space-y-6 select-none max-w-sm text-center">
              {/* Animated Leaf Logo Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-16 h-16 rounded-2xl bg-[#10b981] flex items-center justify-center text-[#042f1a] font-extrabold text-2xl shadow-xl shadow-[#10b981]/25 relative"
              >
                <span className="absolute inset-0 rounded-2xl bg-[#10b981] animate-ping opacity-20 duration-1000" />
                GM
              </motion.div>

              {/* Title */}
              <div className="space-y-2">
                <motion.h1
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-2xl font-bold tracking-tight text-white"
                >
                  Grow<span className="text-[#10b981]">Matrix</span>
                </motion.h1>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-xs text-[#7ea78a] tracking-wider uppercase font-semibold"
                >
                  Transforming Data into Decisions
                </motion.p>
              </div>

              {/* Loading Progress Bar */}
              <div className="w-48 h-1 bg-[#152e20] rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                  className="h-full bg-[#10b981] rounded-full shadow-[0_0_8px_#10b981]"
                />
              </div>
              
              <span className="text-[10px] text-muted-foreground animate-pulse mt-2">
                Initializing Semantic Layers...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
