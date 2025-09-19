import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';

export type MoodType = 'normal' | 'busy' | 'vacation' | 'focus' | 'available' | 'away';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  darkMode: boolean;
  mood: MoodType;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
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
      darkMode: false, // Default to light mode to match the design
      mood: 'normal',
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      toggleDarkMode: () => {
        const newDarkMode = !get().darkMode;
        set({ darkMode: newDarkMode });
        
        // Note: DOM manipulation is now handled in the Providers component
        // to prevent hydration mismatches
      },
      setMood: (mood) => set({ mood }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        darkMode: state.darkMode,
        mood: state.mood
      }),
      onRehydrateStorage: () => (state) => {
        // Note: DOM manipulation is now handled in the Providers component
        // to prevent hydration mismatches
      },
    }
  )
); 