import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

export interface Channel {
  id: string;
  platform: 'instagram' | 'whatsapp' | 'tiktok';
  username: string | null;
  page_id: string | null;
  connected_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface SyncResult {
  imported: number;
  total: number;
  message: string;
}

export function useChannels() {
  return useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => {
      const res = await apiClient.get<Channel[]>('/channels');
      return res.data;
    },
  });
}

export function useMockConnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      const res = await apiClient.post<Channel>('/channels/instagram/mock-connect', { username });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useSyncChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (channelId: string) => {
      const res = await apiClient.post<SyncResult>(`/channels/${channelId}/sync`);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channels'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDisconnectChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/channels/${id}`);
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}
