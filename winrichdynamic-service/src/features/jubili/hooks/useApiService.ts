'use client';

import { useCallback } from 'react';
import { useTokenManager } from '@/utils/tokenManager';
import {
  projectsApi,
  quotationsApi,
  salesOrdersApi,
  activitiesApi,
  opportunitiesApi,
  pipelineStagesApi,
  customersApi,
  dashboardApi,
  forecastApi,
  settingsApi,
  uploadFile,
  Project,
  Quotation,
  SalesOrder,
  Activity,
  Opportunity,
  PipelineStage,
  Customer,
  DashboardData,
  Settings,
  ProjectFilters,
  QuotationFilters,
  SalesOrderFilters,
  ActivityFilters,
  OpportunityFilters,
  CustomerFilters,
  PaginatedResponse
} from '@/features/jubili/services/apiService';

// Custom hook that wraps API service with token management
export const useApiService = () => {
  const { getValidToken, isAuthenticated, loading } = useTokenManager();

  // Projects API with token management
  const projects = {
    getProjects: useCallback(async (filters: ProjectFilters = {}): Promise<PaginatedResponse<Project>> => {
      const token = await getValidToken();
      return projectsApi.getProjects(filters, token);
    }, [getValidToken]),

    getProject: useCallback(async (id: string): Promise<Project> => {
      const token = await getValidToken();
      return projectsApi.getProject(id, token);
    }, [getValidToken]),

    createProject: useCallback(async (projectData: Partial<Project>): Promise<Project> => {
      const token = await getValidToken();
      return projectsApi.createProject(projectData, token);
    }, [getValidToken]),

    updateProject: useCallback(async (id: string, projectData: Partial<Project>): Promise<Project> => {
      const token = await getValidToken();
      return projectsApi.updateProject(id, projectData, token);
    }, [getValidToken]),

    deleteProject: useCallback(async (id: string): Promise<void> => {
      const token = await getValidToken();
      return projectsApi.deleteProject(id, token);
    }, [getValidToken]),

    updateProjectStatus: useCallback(async (id: string, status: string, notes?: string): Promise<Project> => {
      const token = await getValidToken();
      return projectsApi.updateProjectStatus(id, status, notes, token);
    }, [getValidToken]),
  };

  // Quotations API with token management
  const quotations = {
    getQuotations: useCallback(async (filters: QuotationFilters = {}): Promise<PaginatedResponse<Quotation>> => {
      const token = await getValidToken();
      return quotationsApi.getQuotations(filters, token);
    }, [getValidToken]),

    getQuotation: useCallback(async (id: string): Promise<Quotation> => {
      const token = await getValidToken();
      return quotationsApi.getQuotation(id, token);
    }, [getValidToken]),

    createQuotation: useCallback(async (quotationData: Partial<Quotation>): Promise<Quotation> => {
      const token = await getValidToken();
      return quotationsApi.createQuotation(quotationData, token);
    }, [getValidToken]),

    updateQuotation: useCallback(async (id: string, quotationData: Partial<Quotation>): Promise<Quotation> => {
      const token = await getValidToken();
      return quotationsApi.updateQuotation(id, quotationData, token);
    }, [getValidToken]),

    deleteQuotation: useCallback(async (id: string): Promise<void> => {
      const token = await getValidToken();
      return quotationsApi.deleteQuotation(id, token);
    }, [getValidToken]),

    sendQuotation: useCallback(async (id: string, method: 'email' | 'line' | 'manual'): Promise<Quotation> => {
      const token = await getValidToken();
      return quotationsApi.sendQuotation(id, method, token);
    }, [getValidToken]),

    convertToSalesOrder: useCallback(async (id: string): Promise<SalesOrder> => {
      const token = await getValidToken();
      return quotationsApi.convertToSalesOrder(id, token);
    }, [getValidToken]),

    updateQuotationStatus: useCallback(async (id: string, status: string, responseNotes?: string): Promise<Quotation> => {
      const token = await getValidToken();
      return quotationsApi.updateQuotationStatus(id, status, responseNotes, token);
    }, [getValidToken]),
  };

  // Sales Orders API with token management
  const salesOrders = {
    getSalesOrders: useCallback(async (filters: SalesOrderFilters = {}): Promise<PaginatedResponse<SalesOrder>> => {
      const token = await getValidToken();
      return salesOrdersApi.getSalesOrders(filters, token);
    }, [getValidToken]),

    getSalesOrder: useCallback(async (id: string): Promise<SalesOrder> => {
      const token = await getValidToken();
      return salesOrdersApi.getSalesOrder(id, token);
    }, [getValidToken]),

    createSalesOrder: useCallback(async (orderData: Partial<SalesOrder>): Promise<SalesOrder> => {
      const token = await getValidToken();
      return salesOrdersApi.createSalesOrder(orderData, token);
    }, [getValidToken]),

    updateSalesOrder: useCallback(async (id: string, orderData: Partial<SalesOrder>): Promise<SalesOrder> => {
      const token = await getValidToken();
      return salesOrdersApi.updateSalesOrder(id, orderData, token);
    }, [getValidToken]),

    deleteSalesOrder: useCallback(async (id: string): Promise<void> => {
      const token = await getValidToken();
      return salesOrdersApi.deleteSalesOrder(id, token);
    }, [getValidToken]),

    updateOrderStatus: useCallback(async (id: string, status: string): Promise<SalesOrder> => {
      const token = await getValidToken();
      return salesOrdersApi.updateOrderStatus(id, status, token);
    }, [getValidToken]),

    addTracking: useCallback(async (id: string, trackingNumber: string, provider: string): Promise<SalesOrder> => {
      const token = await getValidToken();
      return salesOrdersApi.addTracking(id, trackingNumber, provider, token);
    }, [getValidToken]),

    uploadPackingProof: useCallback(async (id: string, file: File): Promise<SalesOrder> => {
      const token = await getValidToken();
      return salesOrdersApi.uploadPackingProof(id, file, token);
    }, [getValidToken]),

    requestTaxInvoice: useCallback(async (id: string, taxInvoiceData: any): Promise<SalesOrder> => {
      const token = await getValidToken();
      return salesOrdersApi.requestTaxInvoice(id, taxInvoiceData, token);
    }, [getValidToken]),
  };

  // Activities API with token management
  const activities = {
    getActivities: useCallback(async (filters: ActivityFilters = {}): Promise<PaginatedResponse<Activity>> => {
      const token = await getValidToken();
      return activitiesApi.getActivities(filters, token);
    }, [getValidToken]),

    getActivity: useCallback(async (id: string): Promise<Activity> => {
      const token = await getValidToken();
      return activitiesApi.getActivity(id, token);
    }, [getValidToken]),

    createActivity: useCallback(async (activityData: Partial<Activity>): Promise<Activity> => {
      const token = await getValidToken();
      return activitiesApi.createActivity(activityData, token);
    }, [getValidToken]),

    updateActivity: useCallback(async (id: string, activityData: Partial<Activity>): Promise<Activity> => {
      const token = await getValidToken();
      return activitiesApi.updateActivity(id, activityData, token);
    }, [getValidToken]),

    deleteActivity: useCallback(async (id: string): Promise<void> => {
      const token = await getValidToken();
      return activitiesApi.deleteActivity(id, token);
    }, [getValidToken]),

    completeActivity: useCallback(async (id: string, notes?: string): Promise<Activity> => {
      const token = await getValidToken();
      return activitiesApi.completeActivity(id, notes, token);
    }, [getValidToken]),

    postponeActivity: useCallback(async (id: string, newScheduledAt: string, reason?: string): Promise<Activity> => {
      const token = await getValidToken();
      return activitiesApi.postponeActivity(id, newScheduledAt, reason, token);
    }, [getValidToken]),

    cancelActivity: useCallback(async (id: string, reason?: string): Promise<Activity> => {
      const token = await getValidToken();
      return activitiesApi.cancelActivity(id, reason, token);
    }, [getValidToken]),
  };

  // Opportunities API with token management
  const opportunities = {
    getOpportunities: useCallback(async (filters: OpportunityFilters = {}): Promise<PaginatedResponse<Opportunity>> => {
      const token = await getValidToken();
      return opportunitiesApi.getOpportunities(filters, token);
    }, [getValidToken]),

    getOpportunity: useCallback(async (id: string): Promise<Opportunity> => {
      const token = await getValidToken();
      return opportunitiesApi.getOpportunity(id, token);
    }, [getValidToken]),

    createOpportunity: useCallback(async (opportunityData: Partial<Opportunity>): Promise<Opportunity> => {
      const token = await getValidToken();
      return opportunitiesApi.createOpportunity(opportunityData, token);
    }, [getValidToken]),

    updateOpportunity: useCallback(async (id: string, opportunityData: Partial<Opportunity>): Promise<Opportunity> => {
      const token = await getValidToken();
      return opportunitiesApi.updateOpportunity(id, opportunityData, token);
    }, [getValidToken]),

    deleteOpportunity: useCallback(async (id: string): Promise<void> => {
      const token = await getValidToken();
      return opportunitiesApi.deleteOpportunity(id, token);
    }, [getValidToken]),

    updateOpportunityStage: useCallback(async (id: string, stageId: string): Promise<Opportunity> => {
      const token = await getValidToken();
      return opportunitiesApi.updateOpportunityStage(id, stageId, token);
    }, [getValidToken]),

    updateOpportunityStatus: useCallback(async (id: string, status: 'open' | 'won' | 'lost'): Promise<Opportunity> => {
      const token = await getValidToken();
      return opportunitiesApi.updateOpportunityStatus(id, status, token);
    }, [getValidToken]),

    addQuotation: useCallback(async (id: string, quotationId: string): Promise<Opportunity> => {
      const token = await getValidToken();
      return opportunitiesApi.addQuotation(id, quotationId, token);
    }, [getValidToken]),
  };

  const pipelineStages = {
    getPipelineStages: useCallback(async (filters: { team?: string } = {}): Promise<PipelineStage[]> => {
      const token = await getValidToken();
      return pipelineStagesApi.getPipelineStages(filters, token);
    }, [getValidToken]),
  };

  // Customers API with token management
  const customers = {
    getCustomers: useCallback(async (filters: CustomerFilters = {}): Promise<PaginatedResponse<Customer>> => {
      const token = await getValidToken();
      return customersApi.getCustomers(filters, token);
    }, [getValidToken]),

    getCustomer: useCallback(async (id: string): Promise<Customer> => {
      const token = await getValidToken();
      return customersApi.getCustomer(id, token);
    }, [getValidToken]),

    createCustomer: useCallback(async (customerData: Partial<Customer>): Promise<Customer> => {
      const token = await getValidToken();
      return customersApi.createCustomer(customerData, token);
    }, [getValidToken]),

    updateCustomer: useCallback(async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
      const token = await getValidToken();
      return customersApi.updateCustomer(id, customerData, token);
    }, [getValidToken]),

    deleteCustomer: useCallback(async (id: string): Promise<void> => {
      const token = await getValidToken();
      return customersApi.deleteCustomer(id, token);
    }, [getValidToken]),

    searchCustomers: useCallback(async (query: string): Promise<Customer[]> => {
      const token = await getValidToken();
      return customersApi.searchCustomers(query, token);
    }, [getValidToken]),
  };

  // Dashboard API with token management
  const dashboard = {
    getDashboardData: useCallback(async (): Promise<DashboardData> => {
      const token = await getValidToken();
      return dashboardApi.getDashboardData(token);
    }, [getValidToken]),

    getSalesChart: useCallback(async (period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<any[]> => {
      const token = await getValidToken();
      return dashboardApi.getSalesChart(period, token);
    }, [getValidToken]),

    getProjectStatusChart: useCallback(async (): Promise<any[]> => {
      const token = await getValidToken();
      return dashboardApi.getProjectStatusChart(token);
    }, [getValidToken]),

    getOpportunityPipeline: useCallback(async (): Promise<any[]> => {
      const token = await getValidToken();
      return dashboardApi.getOpportunityPipeline(token);
    }, [getValidToken]),
  };

  // Forecast API with token management
  const forecast = {
    getForecast: useCallback(async (period: string = '6months', forecastType: string = 'conservative'): Promise<any> => {
      const token = await getValidToken();
      return forecastApi.getForecast(period, forecastType, token);
    }, [getValidToken]),
  };

  // Settings API with token management
  const settings = {
    getSettings: useCallback(async (): Promise<Settings> => {
      const token = await getValidToken();
      return settingsApi.getSettings(token);
    }, [getValidToken]),

    updateSettings: useCallback(async (settingsData: Partial<Settings>): Promise<Settings> => {
      const token = await getValidToken();
      return settingsApi.updateSettings(settingsData, token);
    }, [getValidToken]),
  };

  // File upload utility with token management
  const upload = useCallback(async (file: File, type: 'image' | 'document' = 'image'): Promise<string> => {
    const token = await getValidToken();
    return uploadFile(file, type, token);
  }, [getValidToken]);

  return {
    projects,
    quotations,
    salesOrders,
    activities,
    opportunities,
    pipelineStages,
    customers,
    dashboard,
    forecast,
    settings,
    upload,
    isAuthenticated,
    loading,
  };
};

export default useApiService;
