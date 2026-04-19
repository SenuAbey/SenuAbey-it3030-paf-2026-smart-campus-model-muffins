import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || 'USER',  // ← persisted role
  isLoading: false,

  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },

  setUser: (user) => set({ user }),

  setRole: (role) => {
    localStorage.setItem('role', role);           // ← persists to localStorage
    set({ role });
  },

  logoutUser: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');              // ← clear on logout
    set({ user: null, token: null, role: 'USER' });
  },
}));