"use client";

import * as React from "react";
import { Users, UserPlus, Key, Mail, Shield, MapPin, RefreshCw, UserCheck } from "lucide-react";
import { useDbStore } from "@/store/dbStore";

export default function UsersManagementPage() {
  const { users, currentUser, switchSessionRole, fetchUsers } = useDbStore();
  const [loading, setLoading] = React.useState(false);

  const handleSwitchPersona = async (role: any) => {
    setLoading(true);
    try {
      await switchSessionRole(role);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users size={20} className="text-primary" />
            <span>Workspace Users Catalog</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage registered workspace analyst profiles and assume roles to test granular column access.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border/60 bg-secondary/10 flex items-center justify-between">
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">Registered Analyst Personas</h3>
            <span className="text-[10px] text-muted-foreground font-semibold">Active User: {currentUser.name}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-foreground">
              <thead>
                <tr className="border-b border-border/60 text-[9px] uppercase font-bold text-muted-foreground bg-secondary/5">
                  <th className="p-4">Analyst Name</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Role Access</th>
                  <th className="p-4">Allowed Regions</th>
                  <th className="p-4">Department</th>
                  <th className="p-4 text-center">Session Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((user) => {
                  const isActive = currentUser.role === user.role;
                  return (
                    <tr key={user.id} className={`hover:bg-secondary/10 ${isActive ? "bg-primary/5" : ""}`}>
                      <td className="p-4 font-semibold flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 select-none">
                          {user.avatar || user.name[0]}
                        </div>
                        <span>{user.name}</span>
                      </td>
                      <td className="p-4 text-muted-foreground font-mono text-[10px]">{user.email}</td>
                      <td className="p-4 font-semibold text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full ${
                          user.role === "Admin" 
                            ? "bg-rose-500/10 text-rose-500" 
                            : user.role === "Analyst" 
                            ? "bg-blue-500/10 text-blue-500" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {user.attributes?.region?.map((r: string) => (
                            <span key={r} className="text-[9px] bg-secondary px-1.5 py-0.5 rounded font-medium">
                              {r}
                            </span>
                          )) || <span className="text-muted-foreground italic">-</span>}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{user.attributes?.department || "-"}</td>
                      <td className="p-4 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full select-none">
                            <UserCheck size={10} />
                            <span>Active Persona</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSwitchPersona(user.role as any)}
                            disabled={loading}
                            className="px-3 py-1 rounded-lg border border-border bg-card hover:bg-secondary/60 text-[10px] font-bold text-foreground transition-colors disabled:opacity-60"
                          >
                            Switch to Persona
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
