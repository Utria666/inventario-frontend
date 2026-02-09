import { apiClient } from '../client';
import type { ProductLocation, Movement, ApiResponse } from '../../types/models';

export interface MovementHistoryParams {
  productId?: string;
  locationId?: string;
  type?: string;
  fromDate?: string;
  toDate?: string;
  limit?: string;
  offset?: string;
}

export interface InventoryValueByCategory {
  categoryId: number;
  categoryName: string;
  value: number;
}

export interface InventoryValueByLocation {
  locationId: number;
  locationName: string;
  value: number;
}

export interface InventoryValueData {
  total: number;
  byCategory: InventoryValueByCategory[];
  byLocation: InventoryValueByLocation[];
}

export const reportsApi = {
  getLowStock: async (): Promise<ProductLocation[]> => {
    const response = await apiClient.get<ApiResponse<ProductLocation[]>>('/reports/low-stock');
    return response.data.data;
  },

  getMovementHistory: async (params?: MovementHistoryParams): Promise<Movement[]> => {
    const query: Record<string, string> = {};
    if (params?.productId) query.productId = params.productId;
    if (params?.locationId) query.locationId = params.locationId;
    if (params?.type) query.type = params.type;
    if (params?.fromDate) query.fromDate = params.fromDate;
    if (params?.toDate) query.toDate = params.toDate;
    if (params?.limit) query.limit = params.limit;
    if (params?.offset) query.offset = params.offset;

    const response = await apiClient.get<ApiResponse<Movement[]>>('/reports/movements', { params: query });
    return response.data.data;
  },

  getInventoryValue: async (): Promise<InventoryValueData> => {
    const response = await apiClient.get<ApiResponse<InventoryValueData>>('/reports/inventory-value');
    return response.data.data;
  },
};
