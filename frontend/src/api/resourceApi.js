import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE = 'http://localhost:8081/api/v1';

const api = axios.create({
    baseURL: BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Attach the JWT token from authStore to every request.
 * This is required because the main branch's SecurityConfig enforces
 * authentication on all POST/PUT/PATCH/DELETE and booking GET endpoints.
 */
api.interceptors.request.use(config => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getResources = (params) => api.get('/resources', { params });
export const getResourceById = (id) => api.get(`/resources/${id}`);
export const createResource = (data) => api.post('/resources', data);
export const updateResource = (id, data) => api.put(`/resources/${id}`, data);
export const deleteResource = (id) => api.delete(`/resources/${id}`);
export const updateResourceStatus = (id, status) => api.patch(`/resources/${id}/status`, null, { params: { status } });
export const getResourceStats = () => api.get('/resources/stats');
