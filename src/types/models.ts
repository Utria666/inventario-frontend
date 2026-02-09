export const Role = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type Role = typeof Role[keyof typeof Role];

export const MovementType = {
  ENTRY: 'ENTRY',
  EXIT: 'EXIT',
  ADJUSTMENT: 'ADJUSTMENT',
  TRANSFER: 'TRANSFER',
} as const;

export type MovementType = typeof MovementType[keyof typeof MovementType];

// Models
export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: number;
  name: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number | string;
  categoryId: number;
  supplierId?: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  supplier?: Supplier;
}

export interface ProductLocation {
  id: number;
  productId: number;
  locationId: number;
  currentStock: number;
  minimumStock: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  location?: Location;
}

export interface Movement {
  id: number;
  type: MovementType;
  quantity: number;
  productLocationId: number;
  targetProductLocationId?: number;
  userId: number;
  notes?: string;
  createdAt: string;
  productLocation?: ProductLocation;
  targetProductLocation?: ProductLocation;
  user?: User;
}

// API Response/Error types
export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
  };
}

// Auth types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
