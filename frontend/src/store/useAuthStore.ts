import { create } from 'zustand';
import { User } from '../types/models';
import { UserRole } from '../types/enums';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  token: null,
  isAuthenticated: false,
  login: (token, user) => set({ user, role: user.role, token, isAuthenticated: true }),
  logout: () => set({ user: null, role: null, token: null, isAuthenticated: false }),
  setRole: (role) => set({ role })
}));
