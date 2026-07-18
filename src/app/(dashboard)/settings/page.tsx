"use client";

import * as React from "react";
import { Settings, RefreshCw, Trash2, ShieldAlert } from "lucide-react";
import { useDbStore } from "@/store/dbStore";

export default function WorkspaceSettingsPage() {
  const { resetDatabase, fetchDatasets, fetchCurrentUser } = useDbStore();
  const [resetting, setResetting] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleRefreshCache = async () => {
    setRefreshing(true);
    setMessage(null);
    try {
      const response = await fetch("http://localhost:3001/api/schema/refresh", {
        method: "POST"
      });
      const data = await response.json();
      if (data.success) {
        await fetchDatasets();
        setMessage("Snowflake schema cache successfully refreshed.");
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Network error: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm("Are you sure you want to reset the in-memory database? This will clear all reports and dashboards.")) {
      return;
    }
    setResetting(true);
    setMessage(null);
    try {
      await resetDatabase();
      setMessage("In-memory database successfully reset to clean defaults.");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings size={20} className="text-primary" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Perform administrative database actions, clear cached metadata, and refresh Snowflake schema links.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {message && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-primary font-medium select-none">
            {message}
          </div>
        )}

        {/* Setting 1: Refresh schema catalog cache */}
        <div className="p-5 border border-border bg-card rounded-xl shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-xs text-foreground">Refresh Snowflake Schema Cache</h3>
              <p className="text-[10px] text-muted-foreground leading-normal max-w-md">
                Refreshes the backend in-memory schema registry cache. Use this after running migrations or altering tables in Snowflake.
              </p>
            </div>
            <button
              onClick={handleRefreshCache}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary/40 text-xs font-semibold text-foreground transition-colors disabled:opacity-60 shrink-0"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh Cache"}</span>
            </button>
          </div>
        </div>

        {/* Setting 2: Reset Database State */}
        <div className="p-5 border border-rose-500/20 bg-card rounded-xl shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-xs text-rose-500">Reset System Database</h3>
              <p className="text-[10px] text-muted-foreground leading-normal max-w-md">
                Wipes all dynamically saved query reports, dashboard widget structures, and resets role permission configurations back to defaults.
              </p>
            </div>
            <button
              onClick={handleResetDatabase}
              disabled={resetting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-semibold text-rose-500 transition-colors disabled:opacity-60 shrink-0"
            >
              <Trash2 size={12} />
              <span>{resetting ? "Resetting..." : "Reset System"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
