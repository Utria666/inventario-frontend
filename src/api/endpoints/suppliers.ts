import { apiClient } from '../client';
import type { Supplier, ApiResponse } from '../../types/models';

export const suppliersApi = {
  getSuppliers: async (): Promise<Supplier[]> => {
    const response = await apiClient.get<ApiResponse<Supplier[]>>('/suppliers');
    return response.data.data;
  },

  getSupplier: async (id: number): Promise<Supplier> => {
    const response = await apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return response.data.data;
  },

  createSupplier: async (data: {
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
  }): Promise<Supplier> => {
    const response = await apiClient.post<ApiResponse<Supplier>>('/suppliers', data);
    return response.data.data;
  },

  updateSupplier: async (
    id: number,
    data: {
      name?: string;
      contactName?: string;
      phone?: string;
      email?: string;
    }
  ): Promise<Supplier> => {
    const response = await apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data);
    return response.data.data;
  },

  deleteSupplier: async (id: number): Promise<Supplier> => {
    const response = await apiClient.delete<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return response.data.data;
  },
};
