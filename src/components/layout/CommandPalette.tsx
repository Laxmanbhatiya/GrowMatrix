"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Database, FileSpreadsheet, ShieldAlert, Users, Settings, Palette, Eye, LucideIcon } from "lucide-react";
import { useCommandPaletteStore } from "@/store/commandPaletteStore";
import { useDbStore } from "@/store/dbStore";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/utils/cn";

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Pages" | "Datasets" | "Saved Reports";
  icon: LucideIcon;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, setIsOpen } = useCommandPaletteStore();
  const { datasets, reports } = useDbStore();
  const { hasReadAccess } = usePermissions();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  // Keyboard shortcut listener to toggle
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Lock scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setActiveIndex(0);
    }
  }, [isOpen]);

  const searchItems: SearchItem[] = React.useMemo(() => {
    const rawPages = [
      { id: "p-dash", feature: "dashboard", title: "Executive Dashboard", subtitle: "Main analytics hub", category: "Pages", icon: Eye, action: () => router.push("/") },
      { id: "p-data", feature: "datasets", title: "Datasets Catalog", subtitle: "Managed schemas & relationships", category: "Pages", icon: Database, action: () => router.push("/datasets") },
      { id: "p-rep-build", feature: "report_builder", title: "Visual Report Builder", subtitle: "Create visual queries using AQN", category: "Pages", icon: Palette, action: () => router.push("/reports/builder") },
      { id: "p-dash-build", feature: "dashboard_builder", title: "Dashboard Canvas Builder", subtitle: "Assemble widgets via dnd-kit", category: "Pages", icon: Settings, action: () => router.push("/dashboards/builder") },
      { id: "p-users", feature: "users", title: "User Management Console", subtitle: "Access governance", category: "Pages", icon: Users, action: () => router.push("/users") },
      { id: "p-roles", feature: "roles", title: "Permissions Matrix", subtitle: "Manage RBAC attributes", category: "Pages", icon: ShieldAlert, action: () => router.push("/roles") },
      { id: "p-sett", feature: "settings", title: "Workspace Settings", subtitle: "System parameters", category: "Pages", icon: Settings, action: () => router.push("/settings") },
    ];

    const items: SearchItem[] = rawPages
      .filter((p) => hasReadAccess(p.feature))
      .map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        category: "Pages",
        icon: p.icon,
        action: p.action
      }));

    // Datasets
    datasets.forEach((d) => {
      // Only include datasets if the user has datasets catalog permissions
      if (hasReadAccess("datasets")) {
        items.push({
          id: `d-${d.id}`,
          title: d.displayName,
          subtitle: `Dataset Registry | ${d.fields.length} semantic fields`,
          category: "Datasets",
          icon: Database,
          action: () => router.push(`/datasets/${d.id}`)
        });
      }
    });

    // Saved Reports
    reports.forEach((r) => {
      // Only include reports if the user has report builder permissions
      if (hasReadAccess("report_builder")) {
        items.push({
          id: `r-${r.id}`,
          title: r.metadata.name,
          subtitle: `Saved Report Template | Querying ${r.query.datasetId}`,
          category: "Saved Reports",
          icon: FileSpreadsheet,
          action: () => router.push(`/reports/builder?id=${r.id}`)
        });
      }
    });

    return items;
  }, [datasets, reports, router, hasReadAccess]);

  // Filter items
  const filtered = React.useMemo(() => {
    if (!query) return searchItems;
    const lower = query.toLowerCase();
    return searchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.subtitle.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower)
    );
  }, [query, searchItems]);

  // Handle Keyboard Navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[activeIndex]) {
          filtered[activeIndex].action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, activeIndex, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-200" 
      />

      {/* Dialog Frame */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[50vh] transition-all transform duration-150 scale-100 animate-in fade-in-50 zoom-in-95">
        
        {/* Search Input bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
          <Search className="text-muted-foreground shrink-0" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Type a page, dataset, or saved report..."
            className="w-full bg-transparent border-0 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground font-sans">
              No matching items found.
            </div>
          ) : (
            <div>
              {/* Group items by category */}
              {["Pages", "Datasets", "Saved Reports"].map((category) => {
                const groupItems = filtered.filter((i) => i.category === category);
                if (groupItems.length === 0) return null;

                return (
                  <div key={category} className="mb-2">
                    <div className="px-4 py-1 text-[10px] font-sans font-semibold tracking-wider text-muted-foreground uppercase">
                      {category}
                    </div>
                    <ul className="mt-1">
                      {groupItems.map((item) => {
                        const globalIndex = filtered.findIndex((fi) => fi.id === item.id);
                        const isFocused = globalIndex === activeIndex;

                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => {
                                item.action();
                                setIsOpen(false);
                              }}
                              className={cn(
                                "flex items-center gap-3 w-full text-left px-4 py-2 text-xs font-sans transition-colors duration-150",
                                isFocused 
                                  ? "bg-primary text-primary-foreground font-semibold" 
                                  : "text-foreground hover:bg-secondary"
                              )}
                            >
                              <item.icon 
                                size={14} 
                                className={cn("shrink-0", isFocused ? "text-primary-foreground" : "text-muted-foreground")} 
                              />
                              <div className="flex-1 truncate">
                                <span className="block truncate font-semibold">{item.title}</span>
                                <span className={cn("block text-[10px] mt-0.5 truncate", isFocused ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                  {item.subtitle}
                                </span>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/30 text-[10px] font-sans text-muted-foreground select-none">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>
          <span>GrowMatrix Global Indexer</span>
        </div>

      </div>
    </div>
  );
}
