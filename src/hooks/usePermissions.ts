"use client";

import { useDbStore } from "@/store/dbStore";
import { Dataset } from "@/types";

export function usePermissions() {
  const { currentUser, rolePermissions, hiddenFeatures } = useDbStore();

  const getPermissionsForFeature = (featureId: string) => {
    const roleConfig = rolePermissions.find((rp) => rp.role === currentUser.role);
    if (!roleConfig) {
      return { read: false, write: false, admin: false };
    }
    return roleConfig.permissions[featureId] || { read: false, write: false, admin: false };
  };

  const hasReadAccess = (featureId: string): boolean => {
    if (featureId !== "settings" && hiddenFeatures?.[featureId]) {
      return false;
    }
    return getPermissionsForFeature(featureId).read;
  };

  const hasWriteAccess = (featureId: string): boolean => {
    return getPermissionsForFeature(featureId).write;
  };

  const hasAdminAccess = (featureId: string): boolean => {
    return getPermissionsForFeature(featureId).admin;
  };

  const canQueryDataset = (dataset: Dataset): boolean => {
    if (currentUser.role === "Admin") return true;
    return dataset.permissions.roles.includes(currentUser.role);
  };

  return {
    currentUser,
    userRole: currentUser.role,
    hasReadAccess,
    hasWriteAccess,
    hasAdminAccess,
    canQueryDataset,
    getPermissionsForFeature
  };
}
