'use client';

import { useTokenManager } from '@/utils/tokenManager';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Error handling class
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: any;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Loading state types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const tokenManager = useTokenManager();
  const token = await tokenManager.getValidToken();
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || 'API request failed',
        response.status,
        data.code,
        data.details
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    );
  }
}

// Utility functions for HTTP methods
const api = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    apiRequest<T>(endpoint, { method: 'GET', ...options }),
  
  post: <T>(endpoint: string, data?: any, options?: RequestInit) => 
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
  
  put: <T>(endpoint: string, data?: any, options?: RequestInit) => 
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
  
  delete: <T>(endpoint: string, options?: RequestInit) => 
    apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
  
  patch: <T>(endpoint: string, data?: any, options?: RequestInit) => 
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
};

// Type definitions based on models
export interface Project {
  _id: string;
  projectCode: string;
  name: string;
  type: string;
  customerId: string;
  customerName: string;
  tags: string[];
  importance: number;
  quotationCount: number;
  activityCount: number;
  startDate: string;
  endDate?: string;
  value: number;
  ownerId: string;
  ownerName: string;
  team: string;
  status: 'planning' | 'proposed' | 'quoted' | 'testing' | 'approved' | 'closed';
  description?: string;
  location?: {
    address: string;
    province: string;
    district: string;
    subdistrict: string;
    zipcode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  _id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerTaxId?: string;
  customerAddress?: string;
  shippingAddress?: string;
  shipToSameAsCustomer?: boolean;
  customerPhone?: string;
  subject: string;
  validUntil: string;
  paymentTerms: string;
  deliveryTerms?: string;
  items: QuotationItem[];
  priceBookId?: string;
  subtotal: number;
  totalDiscount: number;
  specialDiscount?: number;
  totalAmount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  assignedTo?: string;
  notes?: string;
  sentAt?: string;
  sentBy?: string;
  sentMethod?: 'email' | 'line' | 'manual';
  respondedAt?: string;
  responseNotes?: string;
  convertedToOrder?: string;
  salesOrderIssued?: boolean;
  salesOrderNumber?: string;
  salesOrderIssuedAt?: string;
  editHistory?: Array<{
    editedAt: string;
    editedBy?: string;
    remark: string;
    changedFields?: string[];
  }>;
  approvalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  approvalReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  unit: string;
  sku?: string;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  selectedOptions?: Record<string, string>;
}

export interface SalesOrder {
  _id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  discount?: number;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod?: 'cod' | 'transfer';
  status?: 'pending' | 'confirmed' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  shippingProvider?: string;
  deliveryMethod?: 'standard' | 'lalamove';
  packingProofs?: Array<{
    url: string;
    type: 'image' | 'video';
    addedAt: string;
  }>;
  taxInvoice?: {
    requestTaxInvoice: boolean;
    companyName?: string;
    taxId?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
  };
  claimInfo?: {
    claimDate: string;
    claimReason: string;
    claimImages: string[];
    claimStatus: 'pending' | 'approved' | 'rejected';
    adminResponse?: string;
    responseDate?: string;
  };
  slipVerification?: {
    verified: boolean;
    verifiedAt?: string;
    verificationType?: 'manual' | 'automatic';
    verifiedBy?: string;
    status?: string;
    error?: string;
  };
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  unitLabel?: string;
  unitPrice?: number;
}

export interface Activity {
  _id: string;
  type: 'call' | 'meeting' | 'email' | 'task';
  subject: string;
  notes?: string;
  customerId?: string;
  dealId?: string;
  quotationId?: string;
  ownerId?: string;
  scheduledAt?: string;
  remindBeforeMinutes?: number;
  status: 'planned' | 'done' | 'cancelled' | 'postponed';
  postponeReason?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  _id: string;
  title: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  currency?: string;
  stageId: string;
  stageName?: string;
  ownerId?: string;
  team?: string;
  expectedCloseDate?: string;
  status: 'open' | 'won' | 'lost';
  approvalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  probability?: number;
  tags?: string[];
  description?: string;
  quotationIds?: string[];
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  taxId?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  shippingAddress?: string;
  shippingSameAsCompany?: boolean;
  customerCode?: string;
  customerType: 'new' | 'regular' | 'target' | 'inactive';
  assignedTo?: string;
  creditLimit?: number;
  paymentTerms?: string;
  notes?: string;
  tags?: string[];
  priorityStar?: number;
  goals?: string;
  authorizedPhones?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  kpis: {
    projects: {
      total: number;
      active: number;
      completed: number;
      thisMonth: number;
      totalValue: number;
    };
    deals: {
      total: number;
      open: number;
      won: number;
      lost: number;
      thisMonth: number;
      pipelineValue: number;
      wonValue: number;
    };
    orders: {
      total: number;
      thisMonth: number;
      growthRate: number;
      totalValue: number;
    };
    customers: {
      total: number;
      newThisMonth: number;
      active: number;
    };
    quotations: {
      total: number;
      sent: number;
      accepted: number;
      thisMonth: number;
      totalValue: number;
    };
  };
  charts: {
    projectStatusDistribution: Array<{
      _id: string;
      count: number;
    }>;
    dealStageDistribution: Array<{
      _id: string;
      count: number;
      totalValue: number;
    }>;
    monthlySalesTrend: Array<{
      month: string;
      value: number;
      count: number;
    }>;
    customerTypes: Record<string, number>;
  };
  recentActivities: Activity[];
  lastUpdated: string;
}

// Settings type definition
export interface Settings {
  _id?: string;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  taxId?: string;
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
  };
  salesPolicy?: {
    approvalAmountThreshold?: number;
    maxDiscountPercentWithoutApproval?: number;
    tieredDiscounts?: Array<{
      minTotal: number;
      discountPercent: number;
    }>;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Filter types
export interface ProjectFilters {
  page?: number;
  limit?: number;
  q?: string;
  customerId?: string;
  ownerId?: string;
  team?: string;
  status?: string;
  importance?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface QuotationFilters {
  page?: number;
  limit?: number;
  q?: string;
  customerId?: string;
  status?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SalesOrderFilters {
  page?: number;
  limit?: number;
  q?: string;
  customerPhone?: string;
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  customerId?: string;
  dealId?: string;
  quotationId?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface OpportunityFilters {
  page?: number;
  limit?: number;
  q?: string;
  customerId?: string;
  ownerId?: string;
  status?: string;
  stageId?: string;
  team?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  q?: string;
  customerType?: string;
  assignedTo?: string;
  isActive?: boolean;
}

// Projects API
export const projectsApi = {
  // Get all projects with filters
  getProjects: async (filters: ProjectFilters = {}): Promise<PaginatedResponse<Project>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<Project[]>(`/api/projects?${params}`);
    return response as PaginatedResponse<Project>;
  },

  // Get single project by ID
  getProject: async (id: string): Promise<Project> => {
    const response = await api.get<Project>(`/api/projects/${id}`);
    return response.data!;
  },

  // Create new project
  createProject: async (projectData: Partial<Project>): Promise<Project> => {
    const response = await api.post<Project>('/api/projects', projectData);
    return response.data!;
  },

  // Update project
  updateProject: async (id: string, projectData: Partial<Project>): Promise<Project> => {
    const response = await api.put<Project>(`/api/projects/${id}`, projectData);
    return response.data!;
  },

  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/api/projects/${id}`);
  },

  // Update project status
  updateProjectStatus: async (id: string, status: string, notes?: string): Promise<Project> => {
    const response = await api.patch<Project>(`/api/projects/${id}/status`, { status, notes });
    return response.data!;
  },
};

// Quotations API
export const quotationsApi = {
  // Get all quotations with filters
  getQuotations: async (filters: QuotationFilters = {}): Promise<PaginatedResponse<Quotation>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<Quotation[]>(`/api/quotations?${params}`);
    return response as PaginatedResponse<Quotation>;
  },

  // Get single quotation by ID
  getQuotation: async (id: string): Promise<Quotation> => {
    const response = await api.get<Quotation>(`/api/quotations/${id}`);
    return response.data!;
  },

  // Create new quotation
  createQuotation: async (quotationData: Partial<Quotation>): Promise<Quotation> => {
    const response = await api.post<Quotation>('/api/quotations', quotationData);
    return response.data!;
  },

  // Update quotation
  updateQuotation: async (id: string, quotationData: Partial<Quotation>): Promise<Quotation> => {
    const response = await api.put<Quotation>(`/api/quotations/${id}`, quotationData);
    return response.data!;
  },

  // Delete quotation
  deleteQuotation: async (id: string): Promise<void> => {
    await api.delete(`/api/quotations/${id}`);
  },

  // Send quotation
  sendQuotation: async (id: string, method: 'email' | 'line' | 'manual'): Promise<Quotation> => {
    const response = await api.post<Quotation>(`/api/quotations/${id}/send`, { method });
    return response.data!;
  },

  // Convert quotation to sales order
  convertToSalesOrder: async (id: string): Promise<SalesOrder> => {
    const response = await api.post<SalesOrder>(`/api/quotations/${id}/convert`);
    return response.data!;
  },

  // Update quotation status
  updateQuotationStatus: async (id: string, status: string, responseNotes?: string): Promise<Quotation> => {
    const response = await api.patch<Quotation>(`/api/quotations/${id}/status`, { status, responseNotes });
    return response.data!;
  },
};

// Sales Orders API
export const salesOrdersApi = {
  // Get all sales orders with filters
  getSalesOrders: async (filters: SalesOrderFilters = {}): Promise<PaginatedResponse<SalesOrder>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<SalesOrder[]>(`/api/orders?${params}`);
    return response as PaginatedResponse<SalesOrder>;
  },

  // Get single sales order by ID
  getSalesOrder: async (id: string): Promise<SalesOrder> => {
    const response = await api.get<SalesOrder>(`/api/orders/${id}`);
    return response.data!;
  },

  // Create new sales order
  createSalesOrder: async (orderData: Partial<SalesOrder>): Promise<SalesOrder> => {
    const response = await api.post<SalesOrder>('/api/orders', orderData);
    return response.data!;
  },

  // Update sales order
  updateSalesOrder: async (id: string, orderData: Partial<SalesOrder>): Promise<SalesOrder> => {
    const response = await api.put<SalesOrder>(`/api/orders/${id}`, orderData);
    return response.data!;
  },

  // Delete sales order
  deleteSalesOrder: async (id: string): Promise<void> => {
    await api.delete(`/api/orders/${id}`);
  },

  // Update order status
  updateOrderStatus: async (id: string, status: string): Promise<SalesOrder> => {
    const response = await api.patch<SalesOrder>(`/api/orders/${id}/status`, { status });
    return response.data!;
  },

  // Add tracking information
  addTracking: async (id: string, trackingNumber: string, provider: string): Promise<SalesOrder> => {
    const response = await api.post<SalesOrder>(`/api/orders/${id}/tracking`, { trackingNumber, provider });
    return response.data!;
  },

  // Upload packing proof
  uploadPackingProof: async (id: string, file: File): Promise<SalesOrder> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const tokenManager = useTokenManager();
    const token = await tokenManager.getValidToken();
    
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}/upload-packing-proof`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new APIError(data.error || 'Upload failed', response.status);
    }
    return data;
  },

  // Request tax invoice
  requestTaxInvoice: async (id: string, taxInvoiceData: any): Promise<SalesOrder> => {
    const response = await api.post<SalesOrder>(`/api/orders/${id}/tax-invoice`, taxInvoiceData);
    return response.data!;
  },
};

// Activities API
export const activitiesApi = {
  // Get all activities with filters
  getActivities: async (filters: ActivityFilters = {}): Promise<PaginatedResponse<Activity>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<Activity[]>(`/api/activities?${params}`);
    return response as PaginatedResponse<Activity>;
  },

  // Get single activity by ID
  getActivity: async (id: string): Promise<Activity> => {
    const response = await api.get<Activity>(`/api/activities/${id}`);
    return response.data!;
  },

  // Create new activity
  createActivity: async (activityData: Partial<Activity>): Promise<Activity> => {
    const response = await api.post<Activity>('/api/activities', activityData);
    return response.data!;
  },

  // Update activity
  updateActivity: async (id: string, activityData: Partial<Activity>): Promise<Activity> => {
    const response = await api.put<Activity>(`/api/activities/${id}`, activityData);
    return response.data!;
  },

  // Delete activity
  deleteActivity: async (id: string): Promise<void> => {
    await api.delete(`/api/activities/${id}`);
  },

  // Complete activity
  completeActivity: async (id: string, notes?: string): Promise<Activity> => {
    const response = await api.patch<Activity>(`/api/activities/${id}/complete`, { notes });
    return response.data!;
  },

  // Postpone activity
  postponeActivity: async (id: string, newScheduledAt: string, reason?: string): Promise<Activity> => {
    const response = await api.patch<Activity>(`/api/activities/${id}/postpone`, { 
      newScheduledAt, 
      reason 
    });
    return response.data!;
  },

  // Cancel activity
  cancelActivity: async (id: string, reason?: string): Promise<Activity> => {
    const response = await api.patch<Activity>(`/api/activities/${id}/cancel`, { reason });
    return response.data!;
  },
};

// Opportunities API (using Deals API)
export const opportunitiesApi = {
  // Get all opportunities with filters
  getOpportunities: async (filters: OpportunityFilters = {}): Promise<PaginatedResponse<Opportunity>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<Opportunity[]>(`/api/deals?${params}`);
    return response as PaginatedResponse<Opportunity>;
  },

  // Get single opportunity by ID
  getOpportunity: async (id: string): Promise<Opportunity> => {
    const response = await api.get<Opportunity>(`/api/deals/${id}`);
    return response.data!;
  },

  // Create new opportunity
  createOpportunity: async (opportunityData: Partial<Opportunity>): Promise<Opportunity> => {
    const response = await api.post<Opportunity>('/api/deals', opportunityData);
    return response.data!;
  },

  // Update opportunity
  updateOpportunity: async (id: string, opportunityData: Partial<Opportunity>): Promise<Opportunity> => {
    const response = await api.put<Opportunity>(`/api/deals/${id}`, opportunityData);
    return response.data!;
  },

  // Delete opportunity
  deleteOpportunity: async (id: string): Promise<void> => {
    await api.delete(`/api/deals/${id}`);
  },

  // Update opportunity stage
  updateOpportunityStage: async (id: string, stageId: string): Promise<Opportunity> => {
    const response = await api.patch<Opportunity>(`/api/deals/${id}/stage`, { stageId });
    return response.data!;
  },

  // Update opportunity status
  updateOpportunityStatus: async (id: string, status: 'open' | 'won' | 'lost'): Promise<Opportunity> => {
    const response = await api.patch<Opportunity>(`/api/deals/${id}/status`, { status });
    return response.data!;
  },

  // Add quotation to opportunity
  addQuotation: async (id: string, quotationId: string): Promise<Opportunity> => {
    const response = await api.post<Opportunity>(`/api/deals/${id}/quotations`, { quotationId });
    return response.data!;
  },
};

// Customers API
export const customersApi = {
  // Get all customers with filters
  getCustomers: async (filters: CustomerFilters = {}): Promise<PaginatedResponse<Customer>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<Customer[]>(`/api/customers?${params}`);
    return response as PaginatedResponse<Customer>;
  },

  // Get single customer by ID
  getCustomer: async (id: string): Promise<Customer> => {
    const response = await api.get<Customer>(`/api/customers/${id}`);
    return response.data!;
  },

  // Create new customer
  createCustomer: async (customerData: Partial<Customer>): Promise<Customer> => {
    const response = await api.post<Customer>('/api/customers', customerData);
    return response.data!;
  },

  // Update customer
  updateCustomer: async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
    const response = await api.put<Customer>(`/api/customers/${id}`, customerData);
    return response.data!;
  },

  // Delete customer
  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/api/customers/${id}`);
  },

  // Search customers by phone or name
  searchCustomers: async (query: string): Promise<Customer[]> => {
    const response = await api.get<Customer[]>(`/api/customers/search?q=${encodeURIComponent(query)}`);
    return response.data || [];
  },
};

// Dashboard API
export const dashboardApi = {
  // Get dashboard data
  getDashboardData: async (): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/api/dashboard');
    return response.data!;
  },

  // Get sales chart data
  getSalesChart: async (period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<any[]> => {
    const response = await api.get<any[]>(`/api/reports/sales-chart?period=${period}`);
    return response.data || [];
  },

  // Get project status distribution
  getProjectStatusChart: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/api/reports/project-status');
    return response.data || [];
  },

  // Get opportunity pipeline data
  getOpportunityPipeline: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/api/reports/opportunity-pipeline');
    return response.data || [];
  },
};

// Forecast API
export const forecastApi = {
  // Get forecast data
  getForecast: async (period: string = '6months', forecastType: string = 'conservative'): Promise<any> => {
    const response = await api.get<any>(`/api/forecast?period=${period}&type=${forecastType}`);
    return response.data!;
  },
};

// File upload utility
export const uploadFile = async (file: File, type: 'image' | 'document' = 'image'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  const tokenManager = useTokenManager();
  const token = await tokenManager.getValidToken();
  
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new APIError(data.error || 'Upload failed', response.status);
  }
  return data.url;
};

// Settings API
export const settingsApi = {
  // Get settings
  getSettings: async (): Promise<Settings> => {
    const response = await api.get<Settings>('/api/settings');
    return response.data!;
  },

  // Update settings
  updateSettings: async (settingsData: Partial<Settings>): Promise<Settings> => {
    const response = await api.put<Settings>('/api/settings', settingsData);
    return response.data!;
  },
};

// Export all APIs
export const apiService = {
  projects: projectsApi,
  quotations: quotationsApi,
  salesOrders: salesOrdersApi,
  activities: activitiesApi,
  opportunities: opportunitiesApi,
  customers: customersApi,
  dashboard: dashboardApi,
  forecast: forecastApi,
  settings: settingsApi,
  upload: uploadFile,
};

export default apiService;