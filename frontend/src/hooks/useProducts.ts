import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

export interface Product {
  id: string;
  seller_id: string;
  channel_id: string | null;
  external_id: string | null;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  status: 'available' | 'sold' | 'reserved' | 'hidden';
  media_urls: string[];
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

interface ProductFilters {
  status?: string;
  page?: number;
  limit?: number;
}

interface CreateProductInput {
  title: string;
  description?: string;
  price: number;
  currency?: string;
  status?: string;
  media_urls?: string[];
  channel_id?: string;
}

interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export function useProducts(filters?: ProductFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  return useQuery<ProductsResponse>({
    queryKey: ['products', filters],
    queryFn: async () => {
      const res = await apiClient.get<ProductsResponse>(`/products?${params.toString()}`);
      return res.data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await apiClient.get<Product>(`/products/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const res = await apiClient.post<Product>('/products', data);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateProductInput) => {
      const res = await apiClient.put<Product>(`/products/${id}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['product', data.id] });
    },
  });
}

export function useMarkSold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<Product>(`/products/${id}/mark-sold`);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
