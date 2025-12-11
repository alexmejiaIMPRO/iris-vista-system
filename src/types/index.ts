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
export type ProductSource = 'internal' | 'amazon';
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

// Request types
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled';
export type RequestType = 'material_issue' | 'purchase_requisition';

export interface RequestItem {
  id: number;
  product_id?: number;
  amazon_asin?: string;
  name: string;
  specification: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier: string;
  source: ProductSource;
  image_url?: string;
}

export interface RequestHistory {
  id: number;
  user_id: number;
  user?: User;
  action: string;
  comment: string;
  old_status: RequestStatus;
  new_status: RequestStatus;
  created_at: string;
}

export interface PurchaseRequest {
  id: number;
  request_number: string;
  requester_id: number;
  requester?: User;
  status: RequestStatus;
  type: RequestType;
  total_amount: number;
  currency: string;
  cost_center: string;
  purpose: string;
  notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  items: RequestItem[];
  history?: RequestHistory[];
  approved_by?: User;
  approved_at?: string;
  rejected_by?: User;
  rejected_at?: string;
  rejection_reason?: string;
  amazon_order_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRequestInput {
  type: RequestType;
  cost_center: string;
  purpose?: string;
  notes?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  items: {
    product_id?: number;
    amazon_asin?: string;
    name: string;
    specification?: string;
    quantity: number;
    unit_price: number;
    supplier?: string;
    source: ProductSource;
    image_url?: string;
  }[];
}

// Filter Rule types
export type RuleType = 'price_max' | 'price_min' | 'category_allow' | 'category_block' | 'supplier_allow' | 'supplier_block' | 'brand_allow' | 'brand_block' | 'keyword_block';

export interface FilterRule {
  id: number;
  name: string;
  description?: string;
  rule_type: RuleType;
  value: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Amazon Config types
export interface AmazonConfig {
  id: number;

  // PA-API credentials (for product search)
  access_key?: string;
  partner_tag?: string;
  region?: string;
  marketplace?: string;
  has_secret_key: boolean;
  paapi_configured: boolean;

  // Business account credentials (for ordering)
  username?: string;
  account_id?: string;
  business_group?: string;
  default_shipping_address?: string;
  has_password: boolean;
  business_configured: boolean;

  // Status
  is_active: boolean;
  last_sync_at?: string;
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
  rejected_requests: number;
  active_filter_rules: number;
  amazon_configured: boolean;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  urgent: number;
}
