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
        'INVALID_CREDENTIALS': 'Ungültige E-Mail oder Passwort. Bitte überprüfen Sie Ihre Eingaben.',
        'AUTH_REQUIRED': 'Bitte melden Sie sich an, um fortzufahren.',
        'TOKEN_EXPIRED': 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
        'INVALID_TOKEN': 'Ungültige Sitzung. Bitte melden Sie sich erneut an.',
        'ACCOUNT_LOCKED': 'Ihr Konto ist vorübergehend gesperrt. Bitte versuchen Sie es später erneut.',
        'RATE_LIMIT_EXCEEDED': 'Zu viele Versuche. Bitte warten Sie einen Moment.',
        'EMAIL_NOT_VERIFIED': 'Bitte bestätigen Sie Ihre E-Mail-Adresse.',
        'ACCOUNT_SUSPENDED': 'Ihr Konto wurde gesperrt. Bitte kontaktieren Sie den Support.',
        'VALIDATION_ERROR': 'Bitte überprüfen Sie Ihre Eingaben.',
        'NOT_FOUND': 'Die angeforderte Ressource wurde nicht gefunden.',
        'ROUTE_NOT_FOUND': 'Die angeforderte Seite wurde nicht gefunden.',
        'CONFLICT': 'Dieser Eintrag existiert bereits.',
        'FORBIDDEN': 'Sie haben keine Berechtigung für diese Aktion.',
        'INTERNAL_ERROR': 'Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
        'DATABASE_ERROR': 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      };
      
      const errorCode = responseData?.code;
      const friendlyMessage = errorCode ? userFriendlyMessages[errorCode] : null;
      
      // Determine the message: use friendly message if available,
      // otherwise use a clean version of the backend message (strip technical details)
      let displayMessage = friendlyMessage || 'Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.';
      
      // If backend provides a non-technical message and no friendly mapping exists, use it
      if (!friendlyMessage && responseData?.message) {
        const msg = responseData.message as string;
        // Filter out technical/query errors, stack traces, SQL errors
        const isTechnical = /query|syntax|column|relation|table|undefined|null|cannot|TypeError|Error:|at\s+\w+/i.test(msg);
        if (!isTechnical) {
          displayMessage = msg;
        }
      }
      
      return {
        success: false,
        error: {
          message: displayMessage,
          code: errorCode || 'UNKNOWN_ERROR',
          details: responseData?.errors,
        },
      };
    }
    return {
      success: false,
      error: { message: 'Verbindung zum Server nicht möglich. Bitte überprüfen Sie Ihre Internetverbindung.' },
    };
  }
}

export default api;
