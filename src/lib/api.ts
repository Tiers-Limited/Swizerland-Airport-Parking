import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          // Refresh endpoint only returns new accessToken, refreshToken stays the same
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Helper function for API calls
export async function apiCall<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await api.request<ApiResponse<T>>({
      method,
      url: endpoint,
      data,
      ...config,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      
      // Map backend error codes to user-friendly messages
      const userFriendlyMessages: Record<string, string> = {
        'INVALID_CREDENTIALS': 'Invalid email or password. Please check your credentials and try again.',
        'AUTH_REQUIRED': 'Please log in to continue.',
        'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
        'INVALID_TOKEN': 'Invalid session. Please log in again.',
        'ACCOUNT_LOCKED': 'Your account is temporarily locked. Please try again later.',
        'RATE_LIMIT_EXCEEDED': 'Too many attempts. Please wait a moment and try again.',
        'EMAIL_NOT_VERIFIED': 'Please verify your email address before logging in.',
        'ACCOUNT_SUSPENDED': 'Your account has been suspended. Please contact support.',
        'VALIDATION_ERROR': 'Please check your input and try again.',
        'NOT_FOUND': 'The requested resource was not found.',
        'CONFLICT': responseData?.message || 'This resource already exists.',
      };
      
      const errorCode = responseData?.code;
      const friendlyMessage = errorCode ? userFriendlyMessages[errorCode] : null;
      
      return {
        success: false,
        error: {
          message: friendlyMessage || responseData?.message || 'Something went wrong. Please try again.',
          code: errorCode || 'UNKNOWN_ERROR',
          details: responseData?.errors,
        },
      };
    }
    return {
      success: false,
      error: { message: 'Unable to connect to the server. Please check your internet connection.' },
    };
  }
}

export default api;
