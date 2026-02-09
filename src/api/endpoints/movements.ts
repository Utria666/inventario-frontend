import { apiClient } from '../client';
import type { Movement, ApiResponse, MovementType } from '../../types/models';

export interface MovementFilters {
  type?: MovementType;
  productLocationId?: number;
  fromDate?: string;
  toDate?: string;
}

export interface CreateEntryInput {
  type: 'ENTRY';
  productLocationId: number;
  quantity: number;
  notes?: string;
}

export interface CreateExitInput {
  type: 'EXIT';
  productLocationId: number;
  quantity: number;
  notes?: string;
}

export interface CreateAdjustmentInput {
  type: 'ADJUSTMENT';
  productLocationId: number;
  quantity: number;
  notes?: string;
}

export interface CreateTransferInput {
  type: 'TRANSFER';
  sourceProductLocationId: number;
  targetProductLocationId: number;
  quantity: number;
  notes?: string;
}

export type CreateMovementInput =
  | CreateEntryInput
  | CreateExitInput
  | CreateAdjustmentInput
  | CreateTransferInput;

export const movementsApi = {
  getMovements: async (filters?: MovementFilters): Promise<Movement[]> => {
    const params: Record<string, string> = {};
    if (filters?.type) params.type = filters.type;
    if (filters?.productLocationId) params.productLocationId = String(filters.productLocationId);
    if (filters?.fromDate) params.fromDate = filters.fromDate;
    if (filters?.toDate) params.toDate = filters.toDate;

    const response = await apiClient.get<ApiResponse<Movement[]>>('/movements', { params });
    return response.data.data;
  },

  createMovement: async (data: CreateMovementInput): Promise<Movement> => {
    const response = await apiClient.post<ApiResponse<Movement>>('/movements', data);
    return response.data.data;
  },
};
