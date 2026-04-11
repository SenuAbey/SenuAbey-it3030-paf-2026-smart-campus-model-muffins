import axios from 'axios';

const BASE_URL = 'http://localhost:8081/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── TICKETS ────────────────────────────────────────────────────────────────

/**
 * Get all tickets with optional filters and pagination.
 * @param {Object} params - { status, category, priority, resourceId, reportedBy, assignedTo, keyword, page, size, sortBy, sortDir }
 */
export const fetchTickets = (params = {}) =>
  api.get('/tickets', { params }).then(r => r.data);

/**
 * Get a single ticket by ID (includes comments and attachments).
 */
export const fetchTicketById = (id) =>
  api.get(`/tickets/${id}`).then(r => r.data);

/**
 * Create a new incident ticket.
 * @param {Object} ticketData - TicketRequestDTO fields
 */
export const createTicket = (ticketData) =>
  api.post('/tickets', ticketData).then(r => r.data);

/**
 * Update ticket details (title, description, category, priority, etc.)
 */
export const updateTicket = (id, ticketData) =>
  api.put(`/tickets/${id}`, ticketData).then(r => r.data);

/**
 * Delete a ticket by ID.
 */
export const deleteTicket = (id) =>
  api.delete(`/tickets/${id}`).then(r => r.data);

/**
 * Update ticket status. Requires { status, reason? } body.
 * reason is required for REJECTED, optional for RESOLVED (resolution notes).
 */
export const updateTicketStatus = (id, statusData) =>
  api.patch(`/tickets/${id}/status`, statusData).then(r => r.data);

/**
 * Assign a technician to a ticket. Auto-moves to IN_PROGRESS.
 */
export const assignTechnician = (id, assignedTo) =>
  api.patch(`/tickets/${id}/assign`, { assignedTo }).then(r => r.data);

/**
 * Get ticket dashboard statistics.
 */
export const fetchTicketStats = () =>
  api.get('/tickets/stats').then(r => r.data);

// ─── ATTACHMENTS ────────────────────────────────────────────────────────────

/**
 * Upload a file attachment to a ticket (max 3 per ticket).
 * @param {number} ticketId
 * @param {File} file
 * @param {string} uploadedBy
 */
export const uploadAttachment = (ticketId, file, uploadedBy = 'anonymous') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploadedBy', uploadedBy);
  return axios.post(`${BASE_URL}/tickets/${ticketId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

/**
 * Get all attachments for a ticket.
 */
export const fetchAttachments = (ticketId) =>
  api.get(`/tickets/${ticketId}/attachments`).then(r => r.data);

/**
 * Delete a specific attachment.
 */
export const deleteAttachment = (ticketId, attachmentId, requestedBy = 'anonymous') =>
  api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`, {
    params: { requestedBy },
  }).then(r => r.data);

// ─── COMMENTS ───────────────────────────────────────────────────────────────

/**
 * Add a comment to a ticket.
 */
export const addComment = (ticketId, comment, commentedBy) =>
  api.post(`/tickets/${ticketId}/comments`, { comment, commentedBy }).then(r => r.data);

/**
 * Get all comments for a ticket.
 */
export const fetchComments = (ticketId) =>
  api.get(`/tickets/${ticketId}/comments`).then(r => r.data);

/**
 * Edit a comment (only original author can edit).
 */
export const editComment = (ticketId, commentId, comment, commentedBy) =>
  api.put(`/tickets/${ticketId}/comments/${commentId}`, { comment, commentedBy }).then(r => r.data);

/**
 * Delete a comment.
 */
export const deleteComment = (ticketId, commentId, requestedBy = 'anonymous') =>
  api.delete(`/tickets/${ticketId}/comments/${commentId}`, {
    params: { requestedBy },
  }).then(r => r.data);

// ─── RESOURCES (from Module A) ───────────────────────────────────────────────

/**
 * Fetch all resources for the resource dropdown in the ticket form.
 */
export const fetchResources = (params = {}) =>
  api.get('/resources', { params }).then(r => r.data);
