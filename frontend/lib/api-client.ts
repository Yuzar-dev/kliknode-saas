import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { api } from './api-config';

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
    baseURL: api.baseURL,
    timeout: api.timeout,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors and refresh token
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Auto-retry once if backend is briefly restarting (ERR_NETWORK)
        if (!error.response && error.code === 'ERR_NETWORK' && originalRequest && !originalRequest._networkRetry) {
            originalRequest._networkRetry = true;
            await new Promise((resolve) => setTimeout(resolve, 1200));
            return axiosInstance(originalRequest);
        }

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('auth-storage');
                    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                        window.location.replace('/login');
                    }
                    return new Promise(() => { });
                }

                const response = await axios.post(`${api.baseURL}/api/auth/refresh-token`, {
                    refreshToken,
                });

                const { accessToken } = response.data.data.tokens;
                localStorage.setItem('accessToken', accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Échec du rafraîchissement
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('auth-storage');
                if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                    window.location.replace('/login');
                }
                return new Promise(() => { });
            }
        }

        return Promise.reject(error);
    }
);

// API wrapper functions
export const apiClient = {
    get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        axiosInstance.get(url, config),

    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        axiosInstance.post(url, data, config),

    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        axiosInstance.put(url, data, config),

    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        axiosInstance.patch(url, data, config),

    delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        axiosInstance.delete(url, config),
};

export default apiClient;
