import axios from 'axios';

const BASE_URL = 'http://localhost:8081/api/v1';

const api = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } });

// Attach JWT token from localStorage to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get all technicians
export const fetchAllTechnicians = () =>
  api.get('/technicians').then(r => r.data);

// Get single technician
export const fetchTechnicianById = (id) =>
  api.get(`/technicians/${id}`).then(r => r.data);

// Get technicians filtered by category (for assign panel)
export const fetchTechniciansByCategory = (category) =>
  api.get('/technicians/by-category', { params: { category } }).then(r => r.data);

// Create technician (admin)
export const createTechnician = (data) =>
  api.post('/technicians', data).then(r => r.data);

// Update technician
export const updateTechnician = (id, data) =>
  api.put(`/technicians/${id}`, data).then(r => r.data);

// Delete technician
export const deleteTechnician = (id) =>
  api.delete(`/technicians/${id}`).then(r => r.data);

// Submit rating after ticket resolved
export const rateTechnician = (data) =>
  api.post('/technicians/rate', data).then(r => r.data);

// Get all ratings for a technician
export const fetchTechnicianRatings = (id) =>
  api.get(`/technicians/${id}/ratings`).then(r => r.data);
