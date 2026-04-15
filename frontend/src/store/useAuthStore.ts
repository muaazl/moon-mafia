import { create } from 'zustand';
import { UserResponse } from '../lib/types';
import { api } from '../lib/api';

interface AuthState {
    user: UserResponse | null;
    isLoading: boolean;
    isInitialized: boolean;
    setUser: (user: UserResponse | null) => void;
    clearUser: () => void;
    refreshUser: () => Promise<void>;
}

// ASSESSMENT: Virtual Identity — Centralized store managing user session state.
export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isInitialized: false,
    setUser: (user) => set({ user, isInitialized: true, isLoading: false }),
    clearUser: () => set({ user: null, isInitialized: true, isLoading: false }),
    refreshUser: async () => { // ASSESSMENT: Interoperability — Syncing local state with backend user data.
        set({ isLoading: true });
        try {
            const { data } = await api.get<UserResponse>('/auth/me');
            set({ user: data, isInitialized: true, isLoading: false });
        } catch (error) {
            set({ user: null, isInitialized: true, isLoading: false });
        }
    },
}));
