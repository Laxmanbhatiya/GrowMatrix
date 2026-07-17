"use client";

import * as React from "react";
import { ShieldAlert, RefreshCw, KeyRound } from "lucide-react";
import { useDbStore } from "@/store/dbStore";

export function UnauthorizedView() {
  const { currentUser, switchSessionRole } = useDbStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 font-sans select-none text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-6 shadow-md shadow-destructive/10">
        <ShieldAlert size={32} />
      </div>
      
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
        Access Restricted
      </h1>
      
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        Your current session profile is configured with the <span className="font-semibold text-foreground">{currentUser.role}</span> role.
        This role does not have authorization to read resources on this screen.
      </p>

      <div className="bg-secondary/40 border border-border rounded-lg p-4 max-w-sm mb-6 text-left">
        <h4 className="font-semibold text-xs text-foreground uppercase mb-1.5 flex items-center gap-1.5">
          <KeyRound size={12} className="text-primary" />
          <span>Security Diagnostics</span>
        </h4>
        <ul className="text-[11px] text-muted-foreground space-y-1">
          <li>• Required Attribute: <span className="font-mono bg-secondary px-1 py-0.5 rounded text-foreground">Read Permission Matrix</span></li>
          <li>• Active Department: <span className="font-semibold text-foreground">{currentUser.attributes.department}</span></li>
          <li>• Authorized Regions: <span className="font-mono text-foreground">{currentUser.attributes.region.join(", ")}</span></li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => {
            switchSessionRole("Admin");
            window.location.reload();
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/95 transition-all shadow-sm duration-150"
        >
          <RefreshCw size={13} />
          <span>Switch to Admin Mode</span>
        </button>
        
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-secondary transition-colors duration-150"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
