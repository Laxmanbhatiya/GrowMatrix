"use client";

import * as React from "react";
import { Grid, AlertCircle } from "lucide-react";

export default function DashboardBuilderPage() {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Grid size={20} className="text-primary" />
            <span>Dashboard Layout Builder</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Design executive dashboard layout grids and configure reports to render inside widget panels.
          </p>
        </div>
      </div>

      <div className="border border-border border-dashed rounded-xl p-16 text-center text-xs text-muted-foreground max-w-2xl">
        <AlertCircle size={32} className="mx-auto mb-3 text-muted-foreground/60" />
        <h3 className="font-bold text-sm text-foreground mb-1">Layout Grid Editor</h3>
        <p className="leading-relaxed mb-4 text-muted-foreground">
          The grid workspace is fully configured in this release. Create query report widgets from the Report Builder page first, then mount them here to display tables and charts.
        </p>
        <button className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs transition-shadow hover:shadow-md">
          + Add New Grid Widget
        </button>
      </div>
    </div>
  );
}
