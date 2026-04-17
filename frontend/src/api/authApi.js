import axios from 'axios';

const API_BASE = 'http://localhost:8081/api/v1/auth';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const getMe = () => axios.get(`${API_BASE}/me`, getAuthHeaders());
export const logoutApi = () => axios.post(`${API_BASE}/logout`, {}, getAuthHeaders());
export const getAllUsers = () => axios.get(`${API_BASE}/users`, getAuthHeaders());
export const updateUserRole = (id, role) =>
  axios.patch(`${API_BASE}/users/${id}/role`, { role }, getAuthHeaders());