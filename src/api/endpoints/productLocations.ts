import { apiClient } from '../client';
import type { ProductLocation, ApiResponse } from '../../types/models';

export interface ProductLocationFilters {
  productId?: number;
  locationId?: number;
  lowStock?: boolean;
}

export interface CreateProductLocationInput {
  productId: number;
  locationId: number;
  minimumStock?: number;
}

export interface UpdateProductLocationInput {
  minimumStock: number;
}

export const productLocationsApi = {
  getProductLocations: async (filters?: ProductLocationFilters): Promise<ProductLocation[]> => {
    const params: Record<string, string> = {};
    if (filters?.productId) params.productId = String(filters.productId);
    if (filters?.locationId) params.locationId = String(filters.locationId);
    if (filters?.lowStock) params.lowStock = 'true';

    const response = await apiClient.get<ApiResponse<ProductLocation[]>>('/product-locations', { params });
    return response.data.data;
  },

  createProductLocation: async (data: CreateProductLocationInput): Promise<ProductLocation> => {
    const response = await apiClient.post<ApiResponse<ProductLocation>>('/product-locations', data);
    return response.data.data;
  },

  updateProductLocation: async (id: number, data: UpdateProductLocationInput): Promise<ProductLocation> => {
    const response = await apiClient.put<ApiResponse<ProductLocation>>(`/product-locations/${id}`, data);
    return response.data.data;
  },

  deleteProductLocation: async (id: number): Promise<ProductLocation> => {
    const response = await apiClient.delete<ApiResponse<ProductLocation>>(`/product-locations/${id}`);
    return response.data.data;
  },
};
