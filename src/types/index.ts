// User types
export type UserRole = 'admin' | 'supply_chain_manager' | 'general_manager' | 'employee';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  company_code: string;
  cost_center: string;
  department: string;
  status: 'active' | 'inactive';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Product types
export type ProductSource = 'internal' | 'external';
export type StockStatus = 'in_stock' | 'limited' | 'out_of_stock';

export interface ProductImage {
  id: number;
  url: string;
  sort_order: number;
  is_primary: boolean;
  caption?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  name_zh?: string;
  name_es?: string;
  description?: string;
  category: string;
  model: string;
  specification: string;
  spec_zh?: string;
  spec_es?: string;
  supplier: string;
  supplier_code?: string;
  price: number;
  currency: string;
  stock: number;
  min_stock?: number;
  max_stock?: number;
  location?: string;
  stock_status: StockStatus;
  image_url?: string;
  image_emoji?: string;
  clickup_id?: string;
  source: ProductSource;
  is_active: boolean;
  images?: ProductImage[];
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
}

// Request types - Simplified URL-based model
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'info_requested' | 'purchased';
export type Urgency = 'normal' | 'urgent';

export interface RequestHistory {
  id: number;
  user_id: number;
  user?: User;
  action: string;
  comment: string;
  old_status: string;
  new_status: string;
  created_at: string;
}

export interface PurchaseRequest {
  id: number;
  request_number: string;

  // Product info (from URL metadata)
  url: string;
  product_title: string;
  product_image_url: string;
  product_description?: string;
  estimated_price?: number;
  currency: string;

  // Request details
  quantity: number;
  justification: string;
  urgency: Urgency;

  // Requester
  requester_id: number;
  requester?: User;

  // Status
  status: RequestStatus;

  // Amazon automation
  is_amazon_url: boolean;
  added_to_cart: boolean;
  added_to_cart_at?: string;
  cart_error?: string;
  amazon_asin?: string;

  // Approval info
  approved_by?: User;
  approved_by_id?: number;
  approved_at?: string;
  rejected_by?: User;
  rejected_by_id?: number;
  rejected_at?: string;
  rejection_reason?: string;

  // Info request
  info_requested_at?: string;
  info_request_note?: string;

  // Purchase completion
  purchased_by?: User;
  purchased_by_id?: number;
  purchased_at?: string;
  purchase_notes?: string;

  // History
  history?: RequestHistory[];

  // Timestamps
  created_at: string;
  updated_at: string;

  // Legacy fields for backward compatibility
  type?: string;
  total_amount?: number;
  cost_center?: string;
  purpose?: string;
  notes?: string;
  priority?: string;
  items?: any[];
}

// Amazon Config types
export interface AmazonConfig {
  id: number;
  email?: string;
  marketplace?: string;
  has_password: boolean;
  is_active: boolean;
  last_login_at?: string;
  last_test_at?: string;
  test_status?: 'success' | 'failed' | 'pending';
  test_message?: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Dashboard Stats
export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_products: number;
  total_requests: number;
  pending_approvals: number;
  approved_requests: number;
  purchased_orders: number;
  amazon_in_cart: number;
  pending_manual: number;
  amazon_configured: boolean;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  info_required: number;
  purchased: number;
  total: number;
  urgent: number;
  amazon_in_cart: number;
}
