"use client";

import * as React from "react";
import { Users, Shield, Edit2, UserPlus } from "lucide-react";
import { useDbStore } from "@/store/dbStore";
import { motion, AnimatePresence } from "framer-motion";
import { SystemRole, UserSession } from "@/types";

export default function UsersManagementPage() {
  const { users, currentUser, fetchUsers, updateUser, addUser, showNotification } = useDbStore();

  // Edit user modal & form states
  const [editingUser, setEditingUser] = React.useState<UserSession | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editRole, setEditRole] = React.useState<SystemRole>("Viewer");
  const [editDept, setEditDept] = React.useState("");
  const [editRegions, setEditRegions] = React.useState<string[]>([]);

  // Add user modal & form states
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [addName, setAddName] = React.useState("");
  const [addEmail, setAddEmail] = React.useState("");
  const [addPassword, setAddPassword] = React.useState("");
  const [addRole, setAddRole] = React.useState<SystemRole>("Viewer");
  const [addDept, setAddDept] = React.useState("");
  const [addRegions, setAddRegions] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);


  // Edit user handlers
  const handleOpenEditModal = (user: UserSession) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditDept(user.attributes?.department || "");
    setEditRegions(user.attributes?.region || []);
  };

  const handleSaveChanges = async () => {
    if (!editingUser) return;
    if (!editName.trim() || !editEmail.trim()) {
      showNotification("Name and email are required.", "error");
      return;
    }
    try {
      await updateUser({
        id: editingUser.id,
        name: editName,
        email: editEmail,
        role: editRole,
        avatar: editingUser.avatar || editName.charAt(0).toUpperCase(),
        attributes: {
          region: editRegions,
          department: editDept
        }
      });
      setEditingUser(null);
      showNotification("User profile updated successfully!", "success");
      await fetchUsers(); // Reload dynamic user records
    } catch (err) {
      console.error(err);
      showNotification("Failed to save changes.", "error");
    }
  };

  // Add user handlers
  const handleOpenAddModal = () => {
    setAddName("");
    setAddEmail("");
    setAddPassword("");
    setAddRole("Viewer");
    setAddDept("");
    setAddRegions(["Maharashtra"]);
    setIsAddModalOpen(true);
  };

  const handleAddUserSubmit = async () => {
    if (!addName.trim() || !addEmail.trim()) {
      showNotification("Name and email are required.", "error");
      return;
    }
    try {
      await addUser({
        id: "",
        name: addName,
        email: addEmail,
        password: addPassword || "password123",
        role: addRole,
        avatar: addName.charAt(0).toUpperCase(),
        attributes: {
          region: addRegions,
          department: addDept
        }
      });
      setIsAddModalOpen(false);
      showNotification("New workspace user created successfully!", "success");
      await fetchUsers(); // Reload dynamic user records
    } catch (err) {
      console.error(err);
      showNotification("Failed to create user.", "error");
    }
  };

  const isAdmin = currentUser.role === "Admin";

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
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-primary/10 self-start sm:self-center"
            title="Create a new workspace profile"
          >
            <UserPlus size={14} />
            <span>Add User</span>
          </button>
        )}
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
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((user) => {
                  const isActive = currentUser.email === user.email;
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
                        <div className="flex items-center justify-center gap-2">
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-primary/10 hover:bg-primary/20 text-[10px] font-bold text-primary transition-colors cursor-pointer"
                              title="Edit User profile parameters"
                            >
                              <Edit2 size={10} />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit User Modal Overlay */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-foreground font-sans relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                  <Shield size={16} className="text-primary" />
                  <span>Edit User Profile</span>
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    User Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    Role Access
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as SystemRole)}
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 text-foreground cursor-pointer"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Analyst">Analyst</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    placeholder="e.g. Sales, Operations"
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                    Allowed Regions
                  </label>
                  <div className="flex flex-wrap gap-3 p-2 border border-border/80 bg-secondary/20 rounded-lg">
                    {["Maharashtra", "Rajasthan", "Gujarat"].map((region) => {
                      const isChecked = editRegions.includes(region);
                      return (
                        <label key={region} className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setEditRegions(editRegions.filter((r) => r !== region));
                              } else {
                                setEditRegions([...editRegions, region]);
                              }
                            }}
                            className="accent-primary cursor-pointer w-3.5 h-3.5"
                          />
                          <span>{region}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-primary/10"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User Modal Overlay */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-foreground font-sans relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                  <UserPlus size={16} className="text-primary" />
                  <span>Add New Workspace User</span>
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    User Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Lalitha Koka"
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="e.g. lalitha.k@growindigo.co.in"
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    Password
                  </label>
                  <input
                    type="password"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="Defaults to password123"
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    Role Access
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as SystemRole)}
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 text-foreground cursor-pointer"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Analyst">Analyst</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    Department
                  </label>
                  <input
                    type="text"
                    value={addDept}
                    onChange={(e) => setAddDept(e.target.value)}
                    placeholder="e.g. Operations, Sales"
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                    Allowed Regions
                  </label>
                  <div className="flex flex-wrap gap-3 p-2 border border-border/80 bg-secondary/20 rounded-lg">
                    {["Maharashtra", "Rajasthan", "Gujarat"].map((region) => {
                      const isChecked = addRegions.includes(region);
                      return (
                        <label key={region} className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setAddRegions(addRegions.filter((r) => r !== region));
                              } else {
                                setAddRegions([...addRegions, region]);
                              }
                            }}
                            className="accent-primary cursor-pointer w-3.5 h-3.5"
                          />
                          <span>{region}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddUserSubmit}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-primary/10"
                >
                  Create User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
