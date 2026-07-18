"use client";

import { create } from "zustand";
import { Dataset, Relationship, GrowMatrixReport, Dashboard, UserSession, RolePermissions, SystemRole } from "@/types";

const API_BASE = "http://localhost:3001/api";

const EMPTY_USER: UserSession = {
  id: "",
  name: "",
  email: "",
  role: "Viewer",
  avatar: "G",
  attributes: {
    region: [],
    department: ""
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

// Helper to make fetch calls safer and inject JWT auth headers
const fetchJson = async (url: string, options?: RequestInit) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem("growmatrix_token") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers
    });
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
  notification: { message: string; type: "success" | "error" | "info" } | null;
  showNotification: (message: string, type?: "success" | "error" | "info") => void;
  hideNotification: () => void;
  
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
  
  // Auth Actions
  login: (email: string, password: string) => Promise<boolean>;
  loginWithSso: (payload: { ssoId: string; email: string; name: string; avatar?: string; role?: string }) => Promise<boolean>;
  logout: () => void;
}

export const useDbStore = create<DbState>((set, get) => ({
  datasets: [],
  relationships: [],
  reports: [],
  dashboards: [],
  users: [],
  rolePermissions: DEFAULT_ROLE_PERMISSIONS,
  currentUser: EMPTY_USER,
  hiddenFeatures: {},
  notification: null,
  showNotification: (message, type = "success") => {
    set({ notification: { message, type } });
    setTimeout(() => {
      const current = get().notification;
      if (current && current.message === message) {
        set({ notification: null });
      }
    }, 4000);
  },
  hideNotification: () => set({ notification: null }),

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
    const resData = await fetchJson(`${API_BASE}/users/switch-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    if (resData && resData.token && resData.user) {
      localStorage.setItem("growmatrix_token", resData.token);
      set({ currentUser: resData.user });
    }
  },

  resetDatabase: async () => {
    set({
      datasets: [],
      relationships: [],
      reports: [],
      dashboards: [],
      users: [],
      rolePermissions: DEFAULT_ROLE_PERMISSIONS,
      // NOTE: currentUser is intentionally NOT reset — session must survive cache reset
    });
    await fetchJson(`${API_BASE}/reset`, { method: "POST" });
  },

  login: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) return false;
      const json = await res.json();
      if (json.success && json.data?.token) {
        localStorage.setItem("growmatrix_token", json.data.token);
        set({ currentUser: json.data.user });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  },

  loginWithSso: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/auth/sso/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return false;
      const json = await res.json();
      if (json.success && json.data?.token) {
        localStorage.setItem("growmatrix_token", json.data.token);
        set({ currentUser: json.data.user });
        return true;
      }
      return false;
    } catch (error) {
      console.error("SSO Login failed:", error);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("growmatrix_token");
    set({ currentUser: EMPTY_USER });
  }
}));
