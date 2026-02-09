import { apiClient } from '../client';
import type { Location, ApiResponse } from '../../types/models';

export const locationsApi = {
  getLocations: async (): Promise<Location[]> => {
    const response = await apiClient.get<ApiResponse<Location[]>>('/locations');
    return response.data.data;
  },

  getLocation: async (id: number): Promise<Location> => {
    const response = await apiClient.get<ApiResponse<Location>>(`/locations/${id}`);
    return response.data.data;
  },

  createLocation: async (data: { name: string; address?: string }): Promise<Location> => {
    const response = await apiClient.post<ApiResponse<Location>>('/locations', data);
    return response.data.data;
  },

  updateLocation: async (id: number, data: { name?: string; address?: string }): Promise<Location> => {
    const response = await apiClient.put<ApiResponse<Location>>(`/locations/${id}`, data);
    return response.data.data;
  },

  deleteLocation: async (id: number): Promise<Location> => {
    const response = await apiClient.delete<ApiResponse<Location>>(`/locations/${id}`);
    return response.data.data;
  },
};
