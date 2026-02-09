import { apiClient } from '../client';
import type { User, ApiResponse } from '../../types/models';

export interface CreateUserResponse extends ApiResponse<User> {
  tempPassword: string;
}

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  },

  getUser: async (id: number): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/users/me');
    return response.data.data;
  },

  createUser: async (data: {
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
  }): Promise<CreateUserResponse> => {
    const response = await apiClient.post<CreateUserResponse>('/users', data);
    return response.data;
  },

  updateUser: async (
    id: number,
    data: {
      name?: string;
      email?: string;
      role?: 'ADMIN' | 'USER';
    }
  ): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  deleteUser: async (id: number): Promise<User> => {
    const response = await apiClient.delete<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },
};
