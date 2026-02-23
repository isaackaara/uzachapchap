import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Seller {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  plan: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  seller: Seller | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (seller: Seller, tokens: Tokens) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      seller: null,
      accessToken: null,
      refreshToken: null,

      login: (seller, tokens) =>
        set({
          seller,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),

      logout: () =>
        set({ seller: null, accessToken: null, refreshToken: null }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
    }),
    {
      name: 'uzachapchap-auth',
    }
  )
);
