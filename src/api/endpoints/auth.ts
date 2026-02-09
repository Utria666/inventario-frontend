import { apiClient } from '../client';
import type { LoginInput, RegisterInput, AuthResponse } from '../../types/models';

interface AuthApiResponse extends AuthResponse {
  message: string;
}

export const authApi = {
  login: async (credentials: LoginInput): Promise<AuthApiResponse> => {
    const response = await apiClient.post<AuthApiResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterInput): Promise<AuthApiResponse> => {
    const response = await apiClient.post<AuthApiResponse>('/auth/register', data);
    return response.data;
  },
};
