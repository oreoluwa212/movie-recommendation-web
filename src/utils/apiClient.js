
// utils/apiClient.js
import axios from 'axios';

export const createApiClient = () => {
    const apiClient = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL,
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor
    apiClient.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor
    apiClient.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');
            }
            return Promise.reject(error);
        }
    );

    return apiClient;
};