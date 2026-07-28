"use client";

import * as React from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useDbStore } from "@/store/dbStore";

export default function RolesPermissionsPage() {
  const { rolePermissions, updateRolePermission } = useDbStore();
  const [selectedRole, setSelectedRole] = React.useState<"Admin" | "Analyst" | "Viewer">("Admin");

  const features = [
    { id: "dashboard", name: "Executive Dashboard", description: "View summarized database KPI row counts & stats widgets" },
    { id: "report_builder", name: "Visual Report Builder", description: "Visually construct AQN queries and execute SQL against Snowflake" },
    { id: "dashboard_builder", name: "Dashboard Widget Builder", description: "Persist reports into custom layouts and widget configurations" },
    { id: "datasets", name: "Schema & Tables Explorer", description: "Browse live database schemas and tables specification" },
    { id: "users", name: "Analyst Users Directory", description: "Manage registered team members list and switch persona session" },
    { id: "roles", name: "Permissions Configuration", description: "Modify feature RBAC permissions matrix on the fly" },
    { id: "settings", name: "Workspace Settings", description: "Reset database to defaults and clear cached schema catalog" }
  ];

  const currentRoleConfig = rolePermissions.find(rp => rp.role === selectedRole);

  const handleToggle = async (featureId: string, type: 'read' | 'write' | 'admin', currentVal: boolean) => {
    try {
      await updateRolePermission(selectedRole, featureId, type, !currentVal);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldAlert size={20} className="text-primary" />
          <span>Role Permissions Matrix</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure feature flags and access constraints across Analyst roles. Modifications take effect immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Select Role (1 col) */}
        <div className="lg:col-span-1 space-y-2">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Select Role to Configure
          </label>
          <div className="flex flex-col gap-2">
            {(["Admin", "Analyst", "Viewer"] as const).map(role => {
              const isActive = role === selectedRole;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors flex items-center justify-between ${
                    isActive 
                      ? "bg-primary/5 border-primary/30 text-primary font-semibold" 
                      : "bg-card border-border hover:bg-secondary/40 text-muted-foreground"
                  }`}
                >
                  <span className="text-xs">{role} Configuration</span>
                  {isActive && <ShieldCheck size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Feature Matrix List (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/60 bg-secondary/15 flex items-center justify-between">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
                {selectedRole} Access matrix
              </h3>
              <span className="text-[10px] text-muted-foreground font-medium">
                Set feature scopes for the role.
              </span>
            </div>

            <div className="divide-y divide-border/60">
              {features.map((feat) => {
                const perms = currentRoleConfig?.permissions[feat.id] || { read: false, write: false, admin: false };
                return (
                  <div key={feat.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/10">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-xs text-foreground">{feat.name}</h4>
                      <p className="text-[10px] text-muted-foreground leading-normal max-w-md">
                        {feat.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 self-start sm:self-center">
                      {/* Read Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={perms.read}
                          onChange={() => handleToggle(feat.id, 'read', perms.read)}
                          disabled={selectedRole === 'Admin'} // Admin has absolute access
                          className="h-3.5 w-3.5 rounded border-border bg-secondary text-primary focus:ring-0 focus:ring-offset-0 disabled:opacity-60"
                        />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Read</span>
                      </label>

                      {/* Write Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={perms.write}
                          onChange={() => handleToggle(feat.id, 'write', perms.write)}
                          disabled={selectedRole === 'Admin'}
                          className="h-3.5 w-3.5 rounded border-border bg-secondary text-primary focus:ring-0 focus:ring-offset-0 disabled:opacity-60"
                        />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Write</span>
                      </label>

                      {/* Admin Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={perms.admin}
                          onChange={() => handleToggle(feat.id, 'admin', perms.admin)}
                          disabled={selectedRole === 'Admin'}
                          className="h-3.5 w-3.5 rounded border-border bg-secondary text-primary focus:ring-0 focus:ring-offset-0 disabled:opacity-60"
                        />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Admin</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
