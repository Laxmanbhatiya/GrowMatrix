"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useDbStore } from "@/store/dbStore";

const BREADCRUMB_MAP: Record<string, string> = {
  reports: "Reports",
  builder: "Visual Builder",
  dashboards: "Dashboards",
  datasets: "Datasets Catalog",
  charts: "Chart Gallery",
  users: "User Management",
  roles: "Permissions Matrix",
  settings: "Workspace Settings",
  profile: "My Profile",
  notifications: "Notification Center"
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const { datasets, reports, dashboards } = useDbStore();

  const getSegmentName = (segment: string): string => {
    // If it's a static mapping
    if (BREADCRUMB_MAP[segment]) return BREADCRUMB_MAP[segment];

    // Check dynamic parameters
    const dataset = datasets.find(d => d.id === segment);
    if (dataset) return dataset.displayName;

    const report = reports.find(r => r.id === segment);
    if (report) return report.metadata.name;

    const dash = dashboards.find(d => d.id === segment);
    if (dash) return dash.name;

    // Default capitalization
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/[-_]/g, " ");
  };

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
        <Home size={12} />
        <ChevronRight size={10} />
        <span className="font-semibold text-foreground">Dashboard</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
      <Link href="/" className="hover:text-foreground flex items-center gap-1 transition-colors duration-150">
        <Home size={12} />
      </Link>
      <ChevronRight size={10} className="text-muted-foreground/60" />
      {segments.map((segment, index) => {
        const url = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const displayName = getSegmentName(segment);

        return (
          <React.Fragment key={url}>
            {index > 0 && <ChevronRight size={10} className="text-muted-foreground/60" />}
            {isLast ? (
              <span className="font-semibold text-foreground font-sans">{displayName}</span>
            ) : (
              <Link href={url} className="hover:text-foreground transition-colors duration-150 font-sans">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
