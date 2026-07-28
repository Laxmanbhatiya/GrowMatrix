"use client";

import * as React from "react";
import { Suspense } from "react";
import { BookOpen, FileSpreadsheet, Star, Trash2, Search, ArrowRight, Play } from "lucide-react";
import { useDbStore } from "@/store/dbStore";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/utils/cn";

function ReportsIndexContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get("tab") || "library";

  const { datasets, reports, toggleFavoriteReport, deleteReport } = useDbStore();
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredTables = datasets.filter(d => 
    d.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.physicalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const savedReports = React.useMemo(() => {
    return reports.filter(r => 
      r.metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [reports, searchQuery]);

  const favoriteReports = React.useMemo(() => {
    return reports.filter(r => 
      r.metadata?.favorite && 
      r.metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [reports, searchQuery]);

  const handleTabChange = (tab: string) => {
    router.push(`/reports?tab=${tab}`);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            <span>Reports Catalog</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Browse registered database tables or load and execute saved report query configurations.
          </p>
        </div>
      </div>

      {/* Tabs Selector & Search Input */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        <div className="flex border border-border rounded-lg bg-card overflow-hidden w-full sm:w-auto">
          {[
            { id: "library", label: "Report Library", icon: BookOpen },
            { id: "saved", label: "Saved Reports", icon: FileSpreadsheet },
            { id: "favorites", label: "Favorites", icon: Star }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex-1 sm:flex-initial px-4 py-2 font-semibold text-xs flex items-center justify-center gap-2 border-r last:border-r-0 border-border transition-colors",
                activeTabParam === tab.id 
                  ? "bg-secondary text-primary font-bold" 
                  : "text-muted-foreground hover:bg-secondary/40"
              )}
            >
              <tab.icon size={12} className={activeTabParam === tab.id ? "text-primary" : ""} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={
              activeTabParam === "library" ? "Search tables..." : "Search saved reports..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Dynamic Content Grid */}
      {activeTabParam === "library" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTables.length === 0 ? (
            <div className="col-span-full border border-border border-dashed rounded-xl p-16 text-center text-xs text-muted-foreground italic">
              No tables found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredTables.map(d => (
              <div key={d.id} className="border border-border rounded-xl bg-card p-5 shadow-sm space-y-4 hover:border-primary/20 transition-all duration-150 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-xs text-foreground truncate">{d.displayName}</h3>
                  <p className="text-[9px] font-mono text-muted-foreground truncate">{d.physicalName || d.id}</p>
                  {d.description && (
                    <p className="text-[10px] text-muted-foreground leading-normal line-clamp-2 mt-1">
                      {d.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-4">
                  <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                    {(d.rowCount ?? 0).toLocaleString()} Rows
                  </span>
                  <Link
                    href={`/reports/builder?datasetId=${d.id}`}
                    className="flex items-center gap-1 text-[10px] font-bold text-foreground hover:text-primary transition-colors"
                  >
                    <span>Open in Builder</span>
                    <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTabParam === "saved" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedReports.length === 0 ? (
            <div className="col-span-full border border-border border-dashed rounded-xl p-16 text-center text-xs text-muted-foreground italic">
              No saved query templates found
            </div>
          ) : (
            savedReports.map(r => (
              <div key={r.id} className="border border-border rounded-xl bg-card p-5 shadow-sm space-y-4 hover:border-primary/20 transition-all duration-150 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-xs text-foreground truncate">{r.metadata?.name}</h3>
                    <button
                      onClick={() => toggleFavoriteReport(r.id)}
                      className="text-muted-foreground hover:text-amber-500 transition-colors"
                    >
                      <Star size={12} className={r.metadata?.favorite ? "fill-amber-500 text-amber-500" : ""} />
                    </button>
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground truncate">
                    Base Table: {r.query.datasetId}
                  </p>
                  {r.metadata?.description && (
                    <p className="text-[10px] text-muted-foreground leading-normal line-clamp-2 mt-1">
                      {r.metadata.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-4">
                  <button
                    onClick={() => deleteReport(r.id)}
                    className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete Report"
                  >
                    <Trash2 size={12} />
                  </button>
                  <Link
                    href={`/reports/builder?id=${r.id}`}
                    className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground font-semibold text-[10px] rounded-md transition-shadow hover:shadow"
                  >
                    <Play size={8} />
                    <span>Run Query</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTabParam === "favorites" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteReports.length === 0 ? (
            <div className="col-span-full border border-border border-dashed rounded-xl p-16 text-center text-xs text-muted-foreground italic">
              No favorites saved
            </div>
          ) : (
            favoriteReports.map(r => (
              <div key={r.id} className="border border-border rounded-xl bg-card p-5 shadow-sm space-y-4 hover:border-primary/20 transition-all duration-150 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-xs text-foreground truncate">{r.metadata?.name}</h3>
                    <button
                      onClick={() => toggleFavoriteReport(r.id)}
                      className="text-amber-500 transition-colors"
                    >
                      <Star size={12} className="fill-amber-500" />
                    </button>
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground truncate">
                    Base Table: {r.query.datasetId}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-4">
                  <button
                    onClick={() => deleteReport(r.id)}
                    className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                  <Link
                    href={`/reports/builder?id=${r.id}`}
                    className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground font-semibold text-[10px] rounded-md transition-shadow hover:shadow"
                  >
                    <Play size={8} />
                    <span>Run Query</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportsIndexPage() {
  return (
    <Suspense fallback={<div className="text-xs text-muted-foreground italic font-sans p-6">Loading reports...</div>}>
      <ReportsIndexContent />
    </Suspense>
  );
}
