import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  User,
  Product,
  PurchaseRequest,
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
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token } = response.data.data;
          setAccessToken(access_token);
          localStorage.setItem('refresh_token', refresh_token);

          const originalRequest = error.config;
          if (originalRequest) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        } catch {
          setAccessToken(null);
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
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

// Purchase Requests API - New simplified flow
export interface CreatePurchaseRequestInput {
  url: string;
  quantity: number;
  justification: string;
  urgency?: 'normal' | 'urgent';
  product_title?: string;
  product_image_url?: string;
  product_description?: string;
  estimated_price?: number;
  currency?: string;
}

export interface ProductMetadata {
  url: string;
  title: string;
  description: string;
  image_url: string;
  price: number | null;
  currency: string;
  site_name: string;
  is_amazon: boolean;
  amazon_asin: string;
  error: string | null;
}

export const purchaseRequestsApi = {
  // Extract metadata from URL (preview before submission)
  extractMetadata: async (url: string): Promise<ProductMetadata> => {
    const response = await api.post<ApiResponse<ProductMetadata>>('/purchase-requests/extract-metadata', { url });
    return response.data.data!;
  },

  // Create a new purchase request
  create: async (data: CreatePurchaseRequestInput): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>('/purchase-requests', data);
    return response.data.data!;
  },

  // Get my requests
  getMyRequests: async (params?: { page?: number; per_page?: number; status?: string }) => {
    const response = await api.get<ApiResponse<PurchaseRequest[]>>('/purchase-requests/my', { params });
    return response.data;
  },

  // Get a specific request
  get: async (id: number): Promise<PurchaseRequest> => {
    const response = await api.get<ApiResponse<PurchaseRequest>>(`/purchase-requests/${id}`);
    return response.data.data!;
  },

  // Update a request (only if pending or info_requested)
  update: async (id: number, data: Partial<CreatePurchaseRequestInput>): Promise<PurchaseRequest> => {
    const response = await api.put<ApiResponse<PurchaseRequest>>(`/purchase-requests/${id}`, data);
    return response.data.data!;
  },

  // Cancel a request
  cancel: async (id: number): Promise<void> => {
    await api.delete(`/purchase-requests/${id}`);
  },
};

// Legacy requests API for backward compatibility
export const requestsApi = {
  list: async (params?: { page?: number; per_page?: number; status?: string }) => {
    const response = await api.get<ApiResponse<PurchaseRequest[]>>('/requests', { params });
    return response.data;
  },

  getMyRequests: async (params?: { page?: number; per_page?: number; status?: string }) => {
    return purchaseRequestsApi.getMyRequests(params);
  },

  get: async (id: number): Promise<PurchaseRequest> => {
    return purchaseRequestsApi.get(id);
  },

  cancel: async (id: number): Promise<void> => {
    return purchaseRequestsApi.cancel(id);
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

  requestInfo: async (id: number, comment: string): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>(`/approvals/${id}/request-info`, { comment });
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
    email: string;
    password?: string;
    marketplace?: string;
    is_active?: boolean;
  }): Promise<AmazonConfig> => {
    const response = await api.put<ApiResponse<AmazonConfig>>('/admin/amazon/config', data);
    return response.data.data!;
  },

  testAmazonConnection: async (): Promise<{ status: string; message: string }> => {
    const response = await api.post<ApiResponse<{ status: string; message: string }>>('/admin/amazon/test');
    return response.data.data!;
  },

  getAmazonSessionStatus: async (): Promise<{
    initialized: boolean;
    logged_in: boolean;
    email: string;
    base_url: string;
  }> => {
    const response = await api.get<ApiResponse<{
      initialized: boolean;
      logged_in: boolean;
      email: string;
      base_url: string;
    }>>('/admin/amazon/session');
    return response.data.data!;
  },

  // Approved Orders Dashboard
  getApprovedOrders: async (params?: {
    page?: number;
    per_page?: number;
    filter?: 'all' | 'amazon_cart' | 'pending_manual' | 'purchased';
  }) => {
    const response = await api.get<ApiResponse<PurchaseRequest[]>>('/admin/approved-orders', { params });
    return response.data;
  },

  markAsPurchased: async (id: number, notes?: string): Promise<PurchaseRequest> => {
    const response = await api.patch<ApiResponse<PurchaseRequest>>(`/admin/orders/${id}/purchased`, { notes });
    return response.data.data!;
  },

  retryAddToCart: async (id: number): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>(`/admin/orders/${id}/retry-cart`);
    return response.data.data!;
  },
};

export default api;
