import { create } from 'zustand'

export type User = {
  id: number | null
  name?: string | null
  email?: string | null
  password?: string | null
  token?: string | null
  isOnline?: boolean | null
}

type UserState = {
  user: User
  setUser: (u: Partial<User>) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: { id: null, email: null, token: null, isOnline: null },
  setUser: (u) => set((state) => ({ user: { ...state.user, ...u } })),
  clearUser: () => set({ user: { id: null, email: null, token: null, isOnline: null } }),
}))
