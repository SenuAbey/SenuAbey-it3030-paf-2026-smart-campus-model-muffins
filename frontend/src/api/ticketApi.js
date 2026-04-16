import axios from 'axios';

const BASE_URL = 'http://localhost:8081/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchTickets = (params = {}) =>
  api.get('/tickets', { params }).then(r => r.data);

export const fetchTicketById = (id) =>
  api.get(`/tickets/${id}`).then(r => r.data);

export const createTicket = (ticketData) =>
  api.post('/tickets', ticketData).then(r => r.data);

export const updateTicket = (id, ticketData) =>
  api.put(`/tickets/${id}`, ticketData).then(r => r.data);

export const deleteTicket = (id) =>
  api.delete(`/tickets/${id}`).then(r => r.data);

export const updateTicketStatus = (id, statusData) =>
  api.patch(`/tickets/${id}/status`, statusData).then(r => r.data);

export const assignTechnician = (ticketId, body) =>
  api.patch(`/tickets/${ticketId}/assign`, body).then(r => r.data);

export const fetchTicketStats = () =>
  api.get('/tickets/stats').then(r => r.data);

export const uploadAttachment = (ticketId, file, uploadedBy = 'anonymous') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploadedBy', uploadedBy);
  const token = localStorage.getItem('token');
  return axios.post(`${BASE_URL}/tickets/${ticketId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then(r => r.data);
};

export const fetchAttachments = (ticketId) =>
  api.get(`/tickets/${ticketId}/attachments`).then(r => r.data);

export const deleteAttachment = (ticketId, attachmentId, requestedBy = 'anonymous') =>
  api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`, {
    params: { requestedBy },
  }).then(r => r.data);

export const addComment = (ticketId, comment, commentedBy) =>
  api.post(`/tickets/${ticketId}/comments`, { comment, commentedBy }).then(r => r.data);

export const fetchComments = (ticketId) =>
  api.get(`/tickets/${ticketId}/comments`).then(r => r.data);

export const editComment = (ticketId, commentId, comment, commentedBy) =>
  api.put(`/tickets/${ticketId}/comments/${commentId}`, { comment, commentedBy }).then(r => r.data);

export const deleteComment = (ticketId, commentId, requestedBy = 'anonymous') =>
  api.delete(`/tickets/${ticketId}/comments/${commentId}`, {
    params: { requestedBy },
  }).then(r => r.data);

export const fetchResources = (params = {}) =>
  api.get('/resources', { params }).then(r => r.data);
