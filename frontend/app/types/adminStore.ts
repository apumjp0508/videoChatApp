"use client";

import { create } from "zustand";

export type AdminPermissions = {
  videoChat: boolean;
  transcribe: boolean;
};

type AdminState = {
  permissions: AdminPermissions;
  setPermission: (key: keyof AdminPermissions, value: boolean) => void;
  reset: () => void;
};

const defaultPermissions: AdminPermissions = {
  videoChat: true,
  transcribe: true,
};

export const useAdminStore = create<AdminState>((set) => ({
  permissions: defaultPermissions,
  setPermission: (key, value) =>
    set((s) => ({
      permissions: { ...s.permissions, [key]: value },
    })),
  reset: () => set({ permissions: defaultPermissions }),
}));