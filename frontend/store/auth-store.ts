import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '@/types';

interface AuthState {
    user: User | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    rememberMe: boolean;

    // Actions
    login: (user: User, tokens: AuthTokens, rememberMe?: boolean) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            rememberMe: true,

            login: (user, tokens, rememberMe = true) => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
                    if (rememberMe) {
                        localStorage.setItem('accessToken', tokens.accessToken);
                        localStorage.setItem('refreshToken', tokens.refreshToken);
                        sessionStorage.removeItem('accessToken');
                        sessionStorage.removeItem('refreshToken');
                    } else {
                        sessionStorage.setItem('accessToken', tokens.accessToken);
                        sessionStorage.setItem('refreshToken', tokens.refreshToken);
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                    }
                }

                set({
                    user,
                    tokens,
                    isAuthenticated: true,
                    isLoading: false,
                    rememberMe,
                });
            },

            logout: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('rememberMe');
                    sessionStorage.removeItem('accessToken');
                    sessionStorage.removeItem('refreshToken');
                }

                set({
                    user: null,
                    tokens: null,
                    isAuthenticated: false,
                    isLoading: false,
                    rememberMe: false,
                });
            },

            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
