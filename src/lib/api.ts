import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  User,
  Product,
  PurchaseRequest,
  CreateRequestInput,
  FilterRule,
  AmazonConfig,
  DashboardStats,
  ApprovalStats
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const getAccessToken = (): string | null => {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

// Request interceptor
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token } = response.data.data;
          setAccessToken(access_token);
          localStorage.setItem('refresh_token', refresh_token);

          // Retry original request
          const originalRequest = error.config;
          if (originalRequest) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        } catch {
          // Refresh failed, clear tokens and redirect to login
          setAccessToken(null);
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const data = response.data.data!;
    setAccessToken(data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      localStorage.removeItem('refresh_token');
    }
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/profile/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};

// Users API (Admin)
export const usersApi = {
  list: async (params?: { page?: number; per_page?: number; search?: string; role?: string; status?: string }) => {
    const response = await api.get<ApiResponse<User[]>>('/users', { params });
    return response.data;
  },

  get: async (id: number): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data!;
  },

  create: async (data: Partial<User> & { password: string }): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data!;
  },

  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  toggleStatus: async (id: number): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/toggle`);
    return response.data.data!;
  },
};

// Products API
export const productsApi = {
  list: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    source?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const response = await api.get<ApiResponse<Product[]>>('/products', { params });
    return response.data;
  },

  get: async (id: number): Promise<Product> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data!;
  },

  getCategories: async (source?: string): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/products/categories', {
      params: { source }
    });
    return response.data.data!;
  },

  create: async (data: Partial<Product>): Promise<Product> => {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data.data!;
  },

  update: async (id: number, data: Partial<Product>): Promise<Product> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  updateStock: async (id: number, stock: number): Promise<Product> => {
    const response = await api.patch<ApiResponse<Product>>(`/products/${id}/stock`, { stock });
    return response.data.data!;
  },
};

// Requests API
export const requestsApi = {
  list: async (params?: { page?: number; per_page?: number; status?: string; type?: string }) => {
    const response = await api.get<ApiResponse<PurchaseRequest[]>>('/requests', { params });
    return response.data;
  },

  getMyRequests: async (params?: { page?: number; per_page?: number; status?: string }) => {
    const response = await api.get<ApiResponse<PurchaseRequest[]>>('/requests/my', { params });
    return response.data;
  },

  get: async (id: number): Promise<PurchaseRequest> => {
    const response = await api.get<ApiResponse<PurchaseRequest>>(`/requests/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateRequestInput): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>('/requests', data);
    return response.data.data!;
  },

  cancel: async (id: number): Promise<void> => {
    await api.delete(`/requests/${id}`);
  },
};

// Approvals API
export const approvalsApi = {
  listPending: async (params?: { page?: number; per_page?: number }) => {
    const response = await api.get<ApiResponse<PurchaseRequest[]>>('/approvals', { params });
    return response.data;
  },

  getStats: async (): Promise<ApprovalStats> => {
    const response = await api.get<ApiResponse<ApprovalStats>>('/approvals/stats');
    return response.data.data!;
  },

  get: async (id: number): Promise<PurchaseRequest> => {
    const response = await api.get<ApiResponse<PurchaseRequest>>(`/approvals/${id}`);
    return response.data.data!;
  },

  approve: async (id: number, comment?: string): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>(`/approvals/${id}/approve`, { comment });
    return response.data.data!;
  },

  reject: async (id: number, comment: string): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>(`/approvals/${id}/reject`, { comment });
    return response.data.data!;
  },

  return: async (id: number, comment: string): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>(`/approvals/${id}/return`, { comment });
    return response.data.data!;
  },
};

// Admin API
export const adminApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard');
    return response.data.data!;
  },

  // Amazon Config
  getAmazonConfig: async (): Promise<AmazonConfig> => {
    const response = await api.get<ApiResponse<AmazonConfig>>('/admin/amazon/config');
    return response.data.data!;
  },

  saveAmazonConfig: async (data: {
    username: string;
    password?: string;
    account_id?: string;
    business_group?: string;
    default_shipping_address?: string;
  }): Promise<AmazonConfig> => {
    const response = await api.put<ApiResponse<AmazonConfig>>('/admin/amazon/config', data);
    return response.data.data!;
  },

  testAmazonConnection: async (): Promise<{ status: string; message: string }> => {
    const response = await api.post<ApiResponse<{ status: string; message: string }>>('/admin/amazon/test');
    return response.data.data!;
  },

  // Filter Rules
  listFilterRules: async (): Promise<FilterRule[]> => {
    const response = await api.get<ApiResponse<FilterRule[]>>('/admin/filters');
    return response.data.data!;
  },

  createFilterRule: async (data: Partial<FilterRule>): Promise<FilterRule> => {
    const response = await api.post<ApiResponse<FilterRule>>('/admin/filters', data);
    return response.data.data!;
  },

  updateFilterRule: async (id: number, data: Partial<FilterRule>): Promise<FilterRule> => {
    const response = await api.put<ApiResponse<FilterRule>>(`/admin/filters/${id}`, data);
    return response.data.data!;
  },

  deleteFilterRule: async (id: number): Promise<void> => {
    await api.delete(`/admin/filters/${id}`);
  },

  toggleFilterRule: async (id: number): Promise<FilterRule> => {
    const response = await api.patch<ApiResponse<FilterRule>>(`/admin/filters/${id}/toggle`);
    return response.data.data!;
  },
};

// Amazon Product API (for searching Amazon Business products)
export interface AmazonProduct {
  id: number;
  sku: string;
  asin: string;
  name: string;
  description: string;
  category: string;
  specification: string;
  supplier: string;
  price: number;
  currency: string;
  stock: number;
  stock_status: string;
  image_url: string;
  product_url: string;
  source: string;
  is_active: boolean;
  rating: number;
  review_count: number;
  is_prime: boolean;
  is_best_seller: boolean;
}

export interface AmazonSearchParams {
  q: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  sort_by?: string;
}

export interface AmazonSearchResult {
  products: AmazonProduct[];
  total_count: number;
  page: number;
  has_more: boolean;
  is_mock?: boolean;
  error?: string;
}

export const amazonApi = {
  searchProducts: async (params: AmazonSearchParams): Promise<AmazonSearchResult> => {
    const queryParams = new URLSearchParams();
    queryParams.set('q', params.q);
    if (params.category) queryParams.set('category', params.category);
    if (params.min_price) queryParams.set('min_price', params.min_price.toString());
    if (params.max_price) queryParams.set('max_price', params.max_price.toString());
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.sort_by) queryParams.set('sort_by', params.sort_by);

    const response = await api.get<ApiResponse<AmazonSearchResult>>(`/amazon/products?${queryParams.toString()}`);
    return response.data.data!;
  },

  getProductDetails: async (asin: string): Promise<AmazonProduct> => {
    const response = await api.get<ApiResponse<AmazonProduct>>(`/amazon/products/${asin}`);
    return response.data.data!;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/amazon/categories');
    return response.data.data!;
  },

  getActiveFilters: async (): Promise<{
    max_price?: number;
    min_price?: number;
    blocked_categories: string[];
    blocked_suppliers: string[];
    blocked_keywords: string[];
  }> => {
    const response = await api.get<ApiResponse<{
      max_price?: number;
      min_price?: number;
      blocked_categories: string[];
      blocked_suppliers: string[];
      blocked_keywords: string[];
    }>>('/amazon/filters');
    return response.data.data!;
  },
};

export default api;
