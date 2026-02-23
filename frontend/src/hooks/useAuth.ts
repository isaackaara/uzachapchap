import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuthStore, Seller } from '../store/auth.store';

interface LoginResponse {
  seller: Seller;
  accessToken: string;
  refreshToken: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  business_name?: string;
}

interface ForgotPasswordInput {
  email: string;
}

interface ResetPasswordInput {
  token: string;
  password: string;
}

export function useLogin() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await apiClient.post<LoginResponse>('/auth/login', data);
      return res.data;
    },
    onSuccess: (data) => {
      login(data.seller, { accessToken: data.accessToken, refreshToken: data.refreshToken });
    },
  });
}

export function useRegister() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const res = await apiClient.post<LoginResponse>('/auth/register', data);
      return res.data;
    },
    onSuccess: (data) => {
      login(data.seller, { accessToken: data.accessToken, refreshToken: data.refreshToken });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      const res = await apiClient.post<{ message: string }>('/auth/forgot-password', data);
      return res.data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const res = await apiClient.post<{ message: string }>('/auth/reset-password', data);
      return res.data;
    },
  });
}
