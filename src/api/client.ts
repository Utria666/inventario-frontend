import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type { ApiError } from '../types/models';

// En desarrollo: usa '/api' (el proxy de Vite redirige a VITE_API_URL)
// En producción: usa VITE_API_URL + '/api' directamente (no hay proxy)
const baseURL = import.meta.env.PROD && import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

let axiosInstance: AxiosInstance | null = null;

export const getAxiosInstance = (): AxiosInstance => {
  if (!axiosInstance) {
    axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
    });

    axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        const isAuthEndpoint = error.config?.url?.startsWith('/auth/');
        if (error.response?.status === 401 && !isAuthEndpoint) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  return axiosInstance;
};

export const apiClient = getAxiosInstance();
