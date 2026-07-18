"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Search, Bell, Sun, Moon, Sparkles, LogOut, ChevronDown, User, Settings } from "lucide-react";
import { useDbStore } from "@/store/dbStore";
import { useCommandPaletteStore } from "@/store/commandPaletteStore";
import { Breadcrumbs } from "./Breadcrumbs";

export function TopNav() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { currentUser, logout } = useDbStore();
  const { setIsOpen: setOpenSearch } = useCommandPaletteStore();

  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  // Close dropdowns on outside clicks
  const userDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border select-none">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Breadcrumbs />
      </div>

      {/* Right: Tools & Profile */}
      <div className="flex items-center gap-4">
        {/* Global search launcher */}
        <button
          onClick={() => setOpenSearch(true)}
          className="hidden md:flex items-center justify-between w-48 lg:w-64 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-md bg-muted/50 hover:bg-muted transition-colors duration-150 font-sans"
        >
          <div className="flex items-center gap-2">
            <Search size={13} />
            <span>Global Search...</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-card px-1.5 font-mono text-[9px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggler */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary border border-border transition-colors duration-150"
          title="Toggle Theme"
        >
          <Sun size={15} className="block dark:hidden" />
          <Moon size={15} className="hidden dark:block" />
        </button>

        {/* Assigned Role Display (Non-Selectable Badge) */}
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-foreground border border-border/80 rounded-md bg-secondary/50 select-none">
          <Sparkles size={13} className="text-primary" />
          <span className="font-sans">Role: {currentUser.role}</span>
        </div>

        {/* Simulated Notification Indicator */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary border border-border transition-colors duration-150"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-card" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-md shadow-lg z-50 p-4 font-sans text-xs">
              <div className="flex items-center justify-between font-semibold pb-2 border-b border-border">
                <span>Recent Alerts</span>
                <span className="text-[10px] text-primary">Mark all read</span>
              </div>
              <div className="py-2 divide-y divide-border max-h-60 overflow-y-auto">
                <div className="py-2">
                  <p className="font-semibold">Harvest Yields Updated</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Snowflake catalog successfully synchronized 5 minutes ago.</p>
                </div>
                <div className="py-2">
                  <p className="font-semibold">Security Level Alert</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">New Analyst profile provisioned via Admin console.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Card Dropdown */}
        <div ref={userDropdownRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-85 text-left focus:outline-none transition-opacity duration-150"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-sans font-bold text-xs select-none">
              {currentUser.avatar}
            </div>
            <div className="hidden lg:flex flex-col font-sans select-none">
              <span className="text-xs font-semibold text-foreground leading-none flex items-center gap-1">
                <span>{currentUser.name}</span>
                <ChevronDown size={11} className="text-muted-foreground" />
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{currentUser.attributes.department}</span>
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-md shadow-lg z-50 py-1 font-sans text-xs">
              <div className="px-3 py-2 border-b border-border select-none">
                <span className="block font-semibold text-foreground">{currentUser.name}</span>
                <span className="block text-[10px] text-muted-foreground mt-0.5 truncate">
                  {currentUser.email || `${currentUser.id}@growindigo.co.in`}
                </span>
              </div>
              
              <div className="py-1">
                <Link
                  href="/"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-foreground hover:bg-secondary transition-colors duration-150"
                >
                  <User size={13} className="text-muted-foreground" />
                  <span>Home Screen</span>
                </Link>
                
                <Link
                  href="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-foreground hover:bg-secondary transition-colors duration-150"
                >
                  <Settings size={13} className="text-muted-foreground" />
                  <span>Edit Profile</span>
                </Link>
              </div>

              <div className="border-t border-border pt-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                    window.location.reload();
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-rose-500 hover:bg-rose-500/10 transition-colors duration-150 font-semibold"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
