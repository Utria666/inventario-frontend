import { apiClient } from '../client';
import type { Product, ApiResponse } from '../../types/models';

export interface ProductFilters {
  categoryId?: number;
  supplierId?: number;
  search?: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  price: number;
  categoryId: number;
  supplierId?: number;
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  supplierId?: number;
}

export const productsApi = {
  getProducts: async (filters?: ProductFilters): Promise<Product[]> => {
    const params: Record<string, string> = {};
    if (filters?.categoryId) params.categoryId = String(filters.categoryId);
    if (filters?.supplierId) params.supplierId = String(filters.supplierId);
    if (filters?.search) params.search = filters.search;

    const response = await apiClient.get<ApiResponse<Product[]>>('/products', { params });
    return response.data.data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  createProduct: async (data: CreateProductInput): Promise<Product> => {
    const response = await apiClient.post<ApiResponse<Product>>('/products', data);
    return response.data.data;
  },

  updateProduct: async (id: number, data: UpdateProductInput): Promise<Product> => {
    const response = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data;
  },

  deleteProduct: async (id: number): Promise<Product> => {
    const response = await apiClient.delete<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },
};
