import axios from 'axios';

const API_BASE = 'http://localhost:8081/api/v1/notifications';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const getNotifications = () => 
  axios.get(API_BASE, getAuthHeaders());

export const getUnreadCount = () => 
  axios.get(`${API_BASE}/unread-count`, getAuthHeaders());

export const markAllAsRead = () => 
  axios.patch(`${API_BASE}/mark-all-read`, {}, getAuthHeaders());