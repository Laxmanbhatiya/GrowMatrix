"use client";

import { create } from "zustand";
import { Dataset, Relationship, GrowMatrixReport, Dashboard, UserSession, RolePermissions, SystemRole } from "@/types";

const API_BASE = "http://localhost:3001/api";

const DEFAULT_USER: UserSession = {
  id: "usr_admin",
  name: "Admin User",
  email: "admin@growindigo.co.in",
  role: "Admin",
  avatar: "A",
  attributes: {
    region: ["Maharashtra", "Rajasthan", "Gujarat"],
    department: "Sales"
  }
};

const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: "Admin",
    permissions: {
      dashboard: { read: true, write: true, admin: true },
      report_builder: { read: true, write: true, admin: true },
      dashboard_builder: { read: true, write: true, admin: true },
      datasets: { read: true, write: true, admin: true },
      users: { read: true, write: true, admin: true },
      roles: { read: true, write: true, admin: true },
      settings: { read: true, write: true, admin: true }
    }
  }
];

// Helper to make fetch calls safer
const fetchJson = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (res.status === 404) {
      return null; // Quietly ignore unimplemented backend endpoints
    }
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error(`API Error on ${url}:`, err);
    return null;
  }
};

interface DbState {
  datasets: Dataset[];
  relationships: Relationship[];
  reports: GrowMatrixReport[];
  dashboards: Dashboard[];
  users: UserSession[];
  rolePermissions: RolePermissions[];
  currentUser: UserSession;
  hiddenFeatures: Record<string, boolean>;
  
  // Fetch Actions
  fetchDatasets: () => Promise<void>;
  fetchRelationships: () => Promise<void>;
  fetchReports: () => Promise<void>;
  fetchDashboards: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchRolePermissions: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  
  // Mutation Actions
  saveReport: (report: GrowMatrixReport) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  toggleFavoriteReport: (reportId: string) => Promise<void>;
  saveDashboard: (dashboard: Dashboard) => Promise<void>;
  deleteDashboard: (dashboardId: string) => Promise<void>;
  addUser: (user: UserSession) => Promise<void>;
  updateUser: (user: UserSession) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateRolePermission: (role: SystemRole, featureId: string, type: 'read' | 'write' | 'admin', value: boolean) => Promise<void>;
  toggleFeatureVisibility: (featureId: string) => void;
  switchSessionRole: (role: SystemRole) => Promise<void>;
  resetDatabase: () => Promise<void>;
}

export const useDbStore = create<DbState>((set, get) => ({
  datasets: [],
  relationships: [],
  reports: [],
  dashboards: [],
  users: [DEFAULT_USER],
  rolePermissions: DEFAULT_ROLE_PERMISSIONS,
  currentUser: DEFAULT_USER,
  hiddenFeatures: {},

  // Fetch Implementations
  fetchDatasets: async () => {
    const data = await fetchJson(`${API_BASE}/tables`);
    if (data) set({ datasets: data });
  },

  fetchRelationships: async () => {
    const data = await fetchJson(`${API_BASE}/relationships`);
    if (data) set({ relationships: data });
  },

  fetchReports: async () => {
    const data = await fetchJson(`${API_BASE}/reports`);
    if (data) set({ reports: data });
  },

  fetchDashboards: async () => {
    const data = await fetchJson(`${API_BASE}/dashboards`);
    if (data) set({ dashboards: data });
  },

  fetchUsers: async () => {
    const data = await fetchJson(`${API_BASE}/users`);
    if (data) set({ users: data });
  },

  fetchRolePermissions: async () => {
    const data = await fetchJson(`${API_BASE}/permissions`);
    if (data) set({ rolePermissions: data });
  },

  fetchCurrentUser: async () => {
    const data = await fetchJson(`${API_BASE}/users/me`);
    if (data) set({ currentUser: data });
  },

  // Mutation Implementations (with optimistic UI updates)
  saveReport: async (report) => {
    const existing = get().reports;
    const exists = existing.some((r) => r.id === report.id);
    
    // Optimistic Update
    set({
      reports: exists 
        ? existing.map((r) => (r.id === report.id ? report : r))
        : [report, ...existing]
    });

    // API Sync
    await fetchJson(`${API_BASE}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report)
    });
  },

  deleteReport: async (reportId) => {
    // Optimistic Update
    set({
      reports: get().reports.filter((r) => r.id !== reportId)
    });

    // API Sync
    await fetchJson(`${API_BASE}/reports/${reportId}`, {
      method: "DELETE"
    });
  },

  toggleFavoriteReport: async (reportId) => {
    // Optimistic Update
    set({
      reports: get().reports.map((r) =>
        r.id === reportId
          ? { ...r, metadata: { ...r.metadata, favorite: !r.metadata.favorite } }
          : r
      )
    });

    // API Sync
    await fetchJson(`${API_BASE}/reports/${reportId}/favorite`, {
      method: "POST"
    });
  },

  saveDashboard: async (dashboard) => {
    const existing = get().dashboards;
    const exists = existing.some((d) => d.id === dashboard.id);
    
    // Optimistic Update
    set({
      dashboards: exists
        ? existing.map((d) => (d.id === dashboard.id ? dashboard : d))
        : [dashboard, ...existing]
    });

    // API Sync
    await fetchJson(`${API_BASE}/dashboards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dashboard)
    });
  },

  deleteDashboard: async (dashboardId) => {
    // Optimistic Update
    set({
      dashboards: get().dashboards.filter((d) => d.id !== dashboardId)
    });

    // API Sync
    await fetchJson(`${API_BASE}/dashboards/${dashboardId}`, {
      method: "DELETE"
    });
  },

  addUser: async (user) => {
    set({ users: [...get().users, user] });
    await fetchJson(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
  },

  updateUser: async (user) => {
    set({
      users: get().users.map((u) => (u.id === user.id ? user : u))
    });
    await fetchJson(`${API_BASE}/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
  },

  deleteUser: async (userId) => {
    if (userId === "usr_admin") return;
    set({
      users: get().users.filter((u) => u.id !== userId)
    });
    await fetchJson(`${API_BASE}/users/${userId}`, {
      method: "DELETE"
    });
  },

  updateRolePermission: async (role, featureId, type, value) => {
    set({
      rolePermissions: get().rolePermissions.map((rp) => {
        if (rp.role !== role) return rp;
        const updatedPerms = { ...rp.permissions };
        if (!updatedPerms[featureId]) {
          updatedPerms[featureId] = { read: false, write: false, admin: false };
        }
        updatedPerms[featureId] = {
          ...updatedPerms[featureId],
          [type]: value
        };
        return {
          ...rp,
          permissions: updatedPerms
        };
      })
    });

    await fetchJson(`${API_BASE}/permissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, featureId, type, value })
    });
  },

  toggleFeatureVisibility: (featureId) => {
    set({
      hiddenFeatures: {
        ...get().hiddenFeatures,
        [featureId]: !get().hiddenFeatures[featureId]
      }
    });
  },

  switchSessionRole: async (role) => {
    const targetUser = get().users.find((u) => u.role === role);
    if (targetUser) {
      set({ currentUser: targetUser });
    } else {
      const fallbackUser: UserSession = {
        id: `usr_${role.toLowerCase()}`,
        name: `Mock ${role}`,
        email: `${role.toLowerCase()}@growindigo.co.in`,
        role,
        avatar: role[0],
        attributes: {
          region: role === 'Admin' ? ["Maharashtra", "Rajasthan", "Gujarat"] : ["Maharashtra"],
          department: "Sales"
        }
      };
      set({
        users: [...get().users, fallbackUser],
        currentUser: fallbackUser
      });
    }

    await fetchJson(`${API_BASE}/users/switch-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
  },

  resetDatabase: async () => {
    set({
      datasets: [],
      relationships: [],
      reports: [],
      dashboards: [],
      users: [DEFAULT_USER],
      rolePermissions: DEFAULT_ROLE_PERMISSIONS,
      currentUser: DEFAULT_USER,
      hiddenFeatures: {}
    });
    await fetchJson(`${API_BASE}/reset`, { method: "POST" });
  }
}));
