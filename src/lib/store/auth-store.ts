import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FinSightUser {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  mobile_number?: string;
  role_id?: number;
  is_active?: boolean;
  is_locked?: boolean;
  subscription_tier?: number;
  communication_preference?: number;
  stock_update_frequency?: number;
  avatar_url?: string;
  preferences?: Record<string, any>;
  admin_entity_id?: string;
}

export type MoodType = 'normal' | 'busy' | 'vacation' | 'focus' | 'available' | 'away';

interface AuthState {
  user: FinSightUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;       // true once restoreSession() has completed
  darkMode: boolean;
  mood: MoodType;
  setUser: (user: FinSightUser | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setHydrated: (value: boolean) => void;
  toggleDarkMode: () => void;
  setMood: (mood: MoodType) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
      darkMode: false,
      mood: 'normal',

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: (value) => set({ isHydrated: value }),

      toggleDarkMode: () => {
        const newDarkMode = !get().darkMode;
        set({ darkMode: newDarkMode });
      },

      setMood: (mood) => set({ mood }),

      logout: () => {
        localStorage.removeItem('finsight_user_id');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      // Only persist UI preferences — never auth state
      partialize: (state) => ({
        darkMode: state.darkMode,
        mood: state.mood,
      }),
    }
  )
);