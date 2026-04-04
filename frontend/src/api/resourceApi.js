import axios from 'axios';

const BASE = 'http://localhost:8081/api/v1';

const api = axios.create({
    baseURL: BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const getResources = (params) => api.get('/resources', { params });
export const getResourceById = (id) => api.get(`/resources/${id}`);
export const createResource = (data) => api.post('/resources', data);
export const updateResource = (id, data) => api.put(`/resources/${id}`, data);
export const deleteResource = (id) => api.delete(`/resources/${id}`);
export const updateResourceStatus = (id, status) => api.patch(`/resources/${id}/status`, null, { params: { status } });
export const getResourceStats = () => api.get('/resources/stats');