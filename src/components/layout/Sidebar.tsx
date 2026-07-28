"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  Users,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Grid,
  Star,
  BookOpen,
  Sprout
} from "lucide-react";
import { cn } from "@/utils/cn";
import { usePermissions } from "@/hooks/usePermissions";

const NAV_ITEMS = [
  {
    title: "Workspace",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, feature: "dashboard" },
      { name: "Report Library", href: "/reports?tab=library", icon: BookOpen, feature: "report_builder" },
      { name: "Report Builder", href: "/reports/builder", icon: FileSpreadsheet, feature: "report_builder" },
      { name: "Farmer Lookup", href: "/reports/farmer-lookup", icon: Sprout, feature: "report_builder" },
    ]
  },
  {
    title: "Saved Views",
    items: [
      { name: "Saved Reports", href: "/reports?tab=saved", icon: FileSpreadsheet, feature: "report_builder" },
      { name: "Favorites", href: "/reports?tab=favorites", icon: Star, feature: "report_builder" },
      { name: "Dashboard Builder", href: "/dashboards/builder", icon: Grid, feature: "dashboard_builder" }
    ]
  },
  {
    title: "Management",
    items: [
      { name: "Users", href: "/users", icon: Users, feature: "users" },
      { name: "Roles", href: "/roles", icon: ShieldAlert, feature: "roles" },
      { name: "Settings", href: "/settings", icon: Settings, feature: "settings" },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasReadAccess } = usePermissions();

  const [width, setWidth] = React.useState(260);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);

  const startResize = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResize = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < 180) {
        setIsCollapsed(true);
        newWidth = 64;
      } else {
        setIsCollapsed(false);
        if (newWidth > 400) newWidth = 400;
        setWidth(newWidth);
      }
    },
    [isResizing]
  );

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResize);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [isResizing, resize, stopResize]);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-card border-r border-border select-none transition-all duration-200 ease-out",
        isCollapsed ? "w-16" : ""
      )}
      style={{ width: isCollapsed ? undefined : `${width}px` }}
    >
      {/* Brand Header */}
      <div className="flex items-center h-16 px-4 border-b border-border relative">
        {!isCollapsed ? (
          <Link href="/" className="flex items-center gap-2 w-full">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20 shrink-0">
              GM
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold tracking-tight text-sm text-foreground leading-none">
                Grow<span className="text-primary">Matrix</span>
              </span>
              <span className="text-[8px] text-muted-foreground mt-0.5 tracking-tight font-semibold">
                Transforming Data into Decisions.
              </span>
            </div>
          </Link>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold mx-auto">
            GM
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-5 hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-card hover:bg-secondary border border-border text-muted-foreground shadow-sm z-50 cursor-pointer transition-transform hover:scale-105"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6" suppressHydrationWarning>
        {NAV_ITEMS.map((group) => {
          // Filter out entire groups if user doesn't have read access to any item
          const visibleItems = group.items.filter(item => hasReadAccess(item.feature));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 font-sans font-semibold text-xs tracking-wider text-muted-foreground uppercase mb-2">
                  {group.title}
                </h3>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const [itemPath, itemQuery] = item.href.split("?");
                  const queryParams = itemQuery ? new URLSearchParams(itemQuery) : null;
                  
                  let isActive = pathname === itemPath;
                  if (isActive && queryParams) {
                    for (const [key, val] of queryParams.entries()) {
                      if (searchParams.get(key) !== val) {
                        isActive = false;
                        break;
                      }
                    }
                  }
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md font-sans text-sm transition-all duration-150 group",
                          isActive
                            ? "bg-primary text-primary-foreground font-medium shadow-sm shadow-primary/10"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <item.icon size={16} className={cn("shrink-0", isActive ? "" : "group-hover:scale-105 transition-transform duration-150")} />
                        {!isCollapsed && <span>{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}


      </div>

      {/* Footer Branding Info */}
      <div className="p-4 border-t border-border text-center text-xs text-muted-foreground">
        {!isCollapsed ? (
          <div className="flex flex-col gap-0.5 font-sans">
            <span className="font-semibold text-foreground">v2.0 Enterprise</span>
            <span>Transforming Data into Decisions</span>
          </div>
        ) : (
          <span className="font-sans font-bold text-foreground">v2.0</span>
        )}
      </div>

      {/* Resizing Split Handle */}
      {!isCollapsed && (
        <div
          onMouseDown={startResize}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 group active:bg-primary transition-all duration-150"
          style={{ width: "4px" }}
        />
      )}
    </aside>
  );
}
