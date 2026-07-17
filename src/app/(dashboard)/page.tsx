"use client";

import * as React from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Database, 
  FileSpreadsheet, 
  ShieldAlert, 
  Users, 
  Activity, 
  Star, 
  ArrowRight,
  HelpCircle,
  Plus,
  LayoutDashboard,
  Grid
} from "lucide-react";
import { useDbStore } from "@/store/dbStore";
import { usePermissions } from "@/hooks/usePermissions";

export default function DashboardHomePage() {
  const { datasets, reports, dashboards, currentUser } = useDbStore();
  const { hasWriteAccess } = usePermissions();

  const totalTables = datasets.length;
  const totalRows = React.useMemo(() => {
    return datasets.reduce((acc, curr) => acc + (Number(curr.rowCount) || 0), 0);
  }, [datasets]);

  const favoriteReports = React.useMemo(() => {
    return reports.filter(r => r.metadata?.favorite);
  }, [reports]);

  return (
    <div className="space-y-8 font-sans">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <LayoutDashboard className="text-primary" size={24} />
            <span>Enterprise Data Dashboard</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time query metrics and schema statistics connected directly to Snowflake.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/reports/builder"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs transition-shadow duration-200 hover:shadow-md"
          >
            <Plus size={14} />
            <span>Create New Report</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        {/* Card 1 */}
        <div className="p-5 bg-card border border-border rounded-xl shadow-sm flex flex-col justify-between hover:border-primary/20 transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider">Snowflake Tables</span>
            <Database size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">{totalTables}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Registered datasets</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 bg-card border border-border rounded-xl shadow-sm flex flex-col justify-between hover:border-primary/20 transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Rows Cached</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">
              {totalRows.toLocaleString()}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1">Across all Snowflake tables</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 bg-card border border-border rounded-xl shadow-sm flex flex-col justify-between hover:border-primary/20 transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider">Saved Templates</span>
            <FileSpreadsheet size={16} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">{reports.length}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Active query reports</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 bg-card border border-border rounded-xl shadow-sm flex flex-col justify-between hover:border-primary/20 transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Persona</span>
            <Users size={16} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">{currentUser.role}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">{currentUser.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Section, 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Panel */}
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider border-b border-border pb-2">
              Workspace Core Services
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <Link
                href="/reports/builder"
                className="p-4 border border-border rounded-lg bg-secondary/20 hover:border-primary/20 hover:bg-secondary/40 transition-all duration-150 flex flex-col gap-1.5 group"
              >
                <div className="flex items-center justify-between font-semibold text-xs text-foreground group-hover:text-primary">
                  <span>Visual Query Report Builder</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Visually configure filters, groupings, and metrics, and fetch live results from Snowflake.
                </p>
              </Link>
            </div>
          </div>

          {/* Database Table Sizes (Top tables by Row Count) */}
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider border-b border-border pb-2">
              Snowflake Tables catalog
            </h3>
            {totalTables === 0 ? (
              <p className="text-xs text-muted-foreground italic">Loading tables schema...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-foreground">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] uppercase font-bold text-muted-foreground">
                      <th className="py-2.5">Display Name</th>
                      <th className="py-2.5">Physical Table Name</th>
                      <th className="py-2.5 text-right">Row Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.slice(0, 5).map((d) => (
                      <tr key={d.id} className="border-b border-border/40 hover:bg-secondary/20">
                        <td className="py-2.5 font-medium">{d.displayName}</td>
                        <td className="py-2.5 font-mono text-[10px] text-muted-foreground">
                          {d.physicalName}
                        </td>
                        <td className="py-2.5 text-right font-semibold">
                          {(d.rowCount ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {totalTables > 5 && (
              <div className="text-center pt-2">
                <Link href="/reports?tab=library" className="text-[10px] text-primary font-bold hover:underline">
                  View All {totalTables} Tables in Library
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Sidebar section, 1 col) */}
        <div className="space-y-6">
          {/* Favorite reports panel */}
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <span>Favorites</span>
            </h3>

            {favoriteReports.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground italic leading-normal">
                No reports favorited yet.<br />Click the star icon in the builder to save.
              </div>
            ) : (
              <div className="space-y-2">
                {favoriteReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/reports/builder?id=${report.id}`}
                    className="block p-3 border border-border rounded-lg bg-secondary/10 hover:border-primary/20 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between font-semibold text-xs text-foreground mb-1">
                      <span className="truncate">{report.metadata?.name}</span>
                      <ArrowRight size={10} className="text-muted-foreground" />
                    </div>
                    <p className="text-[9px] font-mono text-muted-foreground truncate">
                      Table: {report.query.datasetId}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick System Status info */}
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-3 select-none">
            <h3 className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
              System Connections
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Snowflake SSO</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-bold">
                  CONNECTED
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Backend API</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-bold">
                  ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Database Engine</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-bold">
                  LIVE (JWT)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
