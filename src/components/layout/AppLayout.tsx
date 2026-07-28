"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, Info, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { CommandPalette } from "./CommandPalette";
import { UnauthorizedView } from "./UnauthorizedView";
import { usePermissions } from "@/hooks/usePermissions";
import { useDbStore } from "@/store/dbStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

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
    fetchCurrentUser,
    login,
    notification,
    showNotification,
    hideNotification
  } = useDbStore();

  const [showSplash, setShowSplash] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  // Credentials form state
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loginError, setLoginError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Authenticate session on load
  React.useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("growmatrix_token") : null;
    if (!token) {
      setIsAuthenticated(false);
    } else {
      fetchCurrentUser()
        .then(() => {
          // Verify that a genuine user profile was loaded successfully from the database
          const storeUser = useDbStore.getState().currentUser;
          if (storeUser && storeUser.email) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("growmatrix_token");
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          localStorage.removeItem("growmatrix_token");
          setIsAuthenticated(false);
        });
    }
  }, [fetchCurrentUser]);

  // Fetch application registries only AFTER successful authentication
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchDatasets();
      fetchRelationships();
      fetchReports();
      fetchDashboards();
      fetchUsers();
      fetchRolePermissions();
    }
  }, [isAuthenticated, fetchDatasets, fetchRelationships, fetchReports, fetchDashboards, fetchUsers, fetchRolePermissions]);

  // First boot splash screen triggering after login
  React.useEffect(() => {
    if (isAuthenticated) {
      const shown = sessionStorage.getItem("growmatrix_splash_shown");
      if (!shown) {
        setShowSplash(true);
        const timer = setTimeout(() => {
          setShowSplash(false);
          sessionStorage.setItem("growmatrix_splash_shown", "true");
        }, 2200);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated]);

  // Handle local credential submission
  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);
    try {
      const success = await login(email, password);
      if (success) {
        setIsAuthenticated(true);
      } else {
        setLoginError("Invalid email or password");
      }
    } catch {
      setLoginError("Connection failed. Please check local MongoDB.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle mock Microsoft SSO redirection flow
  const handleMicrosoftSso = async () => {
    showNotification(
      "Microsoft Single Sign-On (SSO) Integration is structurally ready. Please configure Azure AD Client ID & Secrets in backend environment variables to connect genuine OAuth redirects.",
      "info"
    );
  };

  // Auth loading state
  if (isAuthenticated === null) {
    return (
      <div className="w-screen h-screen bg-[#040905] flex items-center justify-center font-sans">
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

  // Login View
  if (isAuthenticated === false) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-gradient-to-br from-[#06150b] via-[#040905] to-[#091f11] flex items-center justify-center font-sans relative p-4">
        {/* Glowing blurred accent orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#10b981]/10 blur-[100px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px] animate-pulse pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-[#0e2115]/30 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl shadow-primary/10 max-w-sm w-full p-8 relative z-10"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-lg shadow-md shadow-primary/20">
              GM
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Grow<span className="text-primary">Matrix</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Enterprise Reporting & Analytics Platform
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLocalLogin} className="space-y-4">
            {loginError && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs"
              >
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                Email Address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-[11px] text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@growindigo.co.in"
                  className="w-full bg-secondary/40 border border-border rounded-lg pl-9 pr-3 py-2 font-sans text-xs focus:outline-none focus:border-primary/50 text-foreground h-[36px] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-[11px] text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-secondary/40 border border-border rounded-lg pl-9 pr-3 py-2 font-sans text-xs focus:outline-none focus:border-primary/50 text-foreground h-[36px] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold text-xs rounded-lg h-[36px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-md shadow-primary/10 mt-6"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-muted-foreground bg-transparent">
              <span className="px-2 bg-[#09160d] text-muted-foreground rounded">Or continue with SSO</span>
            </div>
          </div>

          {/* Microsoft SSO Button */}
          <button
            type="button"
            onClick={handleMicrosoftSso}
            disabled={isSubmitting}
            className="w-full bg-[#152e20]/30 hover:bg-[#152e20]/60 border border-border/80 text-foreground hover:text-white font-semibold text-xs rounded-lg h-[36px] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 23 23">
              <rect x="0" y="0" width="10" height="10" fill="#f25022"/>
              <rect x="11" y="0" width="10" height="10" fill="#7fba00"/>
              <rect x="0" y="11" width="10" height="10" fill="#00a4ef"/>
              <rect x="11" y="11" width="10" height="10" fill="#ffb900"/>
            </svg>
            <span>Sign in with Microsoft</span>
          </button>
        </motion.div>
      </div>
    );
  }

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
              
              <span className="text-[10px] text-[#787878] animate-pulse mt-2">
                Initializing Semantic Layers...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Theme-Matching Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "fixed top-6 right-6 z-[99999] flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl max-w-sm w-full font-sans select-none",
              notification.type === "success"
                ? "bg-[#0c1811]/90 border-emerald-500/30 shadow-emerald-500/5 text-emerald-50"
                : notification.type === "error"
                ? "bg-[#180c0c]/90 border-rose-500/30 shadow-rose-500/5 text-rose-50"
                : "bg-[#0c1318]/90 border-blue-500/30 shadow-blue-500/5 text-blue-50"
            )}
          >
            {notification.type === "success" && (
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            )}
            {notification.type === "error" && (
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            )}
            {notification.type === "info" && (
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 space-y-0.5 pr-2">
              <h5 className="font-bold text-xs tracking-tight">
                {notification.type === "success"
                  ? "Operation Successful"
                  : notification.type === "error"
                  ? "System Alert"
                  : "Information Notification"}
              </h5>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {notification.message}
              </p>
            </div>

            <button
              onClick={hideNotification}
              className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0 mt-0.5"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
