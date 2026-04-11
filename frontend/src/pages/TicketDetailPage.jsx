import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchTicketById,
  updateTicketStatus,
  assignTechnician,
  uploadAttachment,
  deleteAttachment,
  addComment,
  editComment,
  deleteComment,
  deleteTicket,
} from '../api/ticketApi';
import './tickets.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (contentType) => {
  if (!contentType) return '📎';
  if (contentType.startsWith('image/')) return '🖼️';
  if (contentType === 'application/pdf') return '📄';
  return '📎';
};

const categoryLabel = (cat) => cat?.replace(/_/g, ' ') || '—';

// Status flow config
const STATUS_ACTIONS = {
  OPEN: [
    { label: '▶ Move to In Progress', nextStatus: 'IN_PROGRESS', style: 'btn-primary', needsReason: false },
    { label: '✕ Reject Ticket', nextStatus: 'REJECTED', style: 'btn-danger', needsReason: true },
    { label: '⊗ Close Ticket', nextStatus: 'CLOSED', style: 'btn-ghost', needsReason: false },
  ],
  IN_PROGRESS: [
    { label: '✓ Mark as Resolved', nextStatus: 'RESOLVED', style: 'btn-primary', needsReason: false, reasonLabel: 'Resolution notes (optional)' },
    { label: '✕ Reject Ticket', nextStatus: 'REJECTED', style: 'btn-danger', needsReason: true },
  ],
  RESOLVED: [
    { label: '⊗ Close Ticket', nextStatus: 'CLOSED', style: 'btn-primary', needsReason: false },
    { label: '↩ Re-open (In Progress)', nextStatus: 'IN_PROGRESS', style: 'btn-ghost', needsReason: false },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SLATimer({ ticket }) {
  const [hours, setHours] = useState(0);

  useEffect(() => {
    const calc = () => {
      if (!ticket.createdAt) return;
      const start = new Date(ticket.createdAt).getTime();
      const end = ticket.resolvedAt
        ? new Date(ticket.resolvedAt).getTime()
        : Date.now();
      setHours(Math.floor((end - start) / 3600000));
    };
    calc();
    const interval = !ticket.resolvedAt ? setInterval(calc, 60000) : null;
    return () => interval && clearInterval(interval);
  }, [ticket]);

  const slaThresholds = { LOW: 72, MEDIUM: 48, HIGH: 24, CRITICAL: 8 };
  const threshold = slaThresholds[ticket.priority] || 48;
  const isOverdue = hours > threshold && !['RESOLVED', 'CLOSED', 'REJECTED'].includes(ticket.status);

  return (
    <div className={`sla-timer ${isOverdue ? 'overdue' : ''}`}>
      <div>
        <div className="sla-hours">{hours}h</div>
        <div className="sla-label">
          {ticket.resolvedAt ? 'Time to resolve' : 'Open duration'}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: '600', color: isOverdue ? 'var(--priority-critical)' : 'var(--sliit-blue)', marginBottom: '0.2rem' }}>
          {isOverdue ? '⚠️ SLA Exceeded' : '✓ Within SLA'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
          Target: {threshold}h for {ticket.priority} priority
        </div>
        {ticket.firstResponseAt && (
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.2rem' }}>
            First response: {Math.floor((new Date(ticket.firstResponseAt) - new Date(ticket.createdAt)) / 3600000)}h after creation
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    OPEN: ['🔵', 'badge-status-OPEN'],
    IN_PROGRESS: ['🟡', 'badge-status-IN_PROGRESS'],
    RESOLVED: ['🟢', 'badge-status-RESOLVED'],
    CLOSED: ['⚫', 'badge-status-CLOSED'],
    REJECTED: ['🔴', 'badge-status-REJECTED'],
  };
  const [icon, cls] = map[status] || ['', ''];
  return <span className={`badge ${cls}`}>{icon} {status?.replace('_', ' ')}</span>;
}

function PriorityBadge({ priority }) {
  const icons = { LOW: '▼', MEDIUM: '●', HIGH: '▲', CRITICAL: '🔥' };
  return <span className={`badge badge-priority-${priority}`}>{icons[priority]} {priority}</span>;
}

function ReasonModal({ title, placeholder, onConfirm, onCancel, required = false }) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{required ? 'A reason is required for this action.' : 'You can optionally add notes.'}</p>
        <textarea
          placeholder={placeholder}
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={required && !reason.trim()}
            onClick={() => onConfirm(reason)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.success || '');

  // Action states
  const [statusModal, setStatusModal] = useState(null); // { nextStatus, needsReason, reasonLabel }
  const [assignInput, setAssignInput] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Comment states
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [editingComment, setEditingComment] = useState(null); // { id, text }
  const [commentLoading, setCommentLoading] = useState(false);

  // Attachment states
  const [uploadingFile, setUploadingFile] = useState(false);

  // Current user — will come from Auth (Module E) later
  const currentUser = 'admin'; // TODO: replace with auth context

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTicketById(id);
      setTicket(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Ticket not found or server error.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ─── Status Update ──────────────────────────────────────────────────────────

  const handleStatusAction = (action) => {
    if (action.needsReason || action.reasonLabel) {
      setStatusModal(action);
    } else {
      doStatusUpdate(action.nextStatus, '');
    }
  };

  const doStatusUpdate = async (nextStatus, reason) => {
    setActionLoading(true);
    setStatusModal(null);
    try {
      await updateTicketStatus(id, { status: nextStatus, reason });
      setSuccessMsg(`Ticket status updated to ${nextStatus.replace('_', ' ')}`);
      await loadTicket();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Assign ─────────────────────────────────────────────────────────────────

  const handleAssign = async () => {
    if (!assignInput.trim()) return;
    setActionLoading(true);
    try {
      await assignTechnician(id, assignInput.trim());
      setSuccessMsg(`Ticket assigned to ${assignInput.trim()}`);
      setAssignInput('');
      setShowAssignForm(false);
      await loadTicket();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to assign technician.');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Attachments ─────────────────────────────────────────────────────────────

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if ((ticket.attachments || []).length >= 3) {
      setError('Maximum of 3 attachments allowed per ticket.');
      return;
    }

    setUploadingFile(true);
    try {
      await uploadAttachment(id, file, currentUser);
      setSuccessMsg('Attachment uploaded successfully.');
      await loadTicket();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to upload attachment.');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Delete this attachment?')) return;
    try {
      await deleteAttachment(id, attachmentId, currentUser);
      setSuccessMsg('Attachment deleted.');
      await loadTicket();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete attachment.');
    }
  };

  // ─── Comments ───────────────────────────────────────────────────────────────

  const handleAddComment = async () => {
    if (!commentText.trim() || !commentAuthor.trim()) {
      setError('Both your name and comment text are required.');
      return;
    }
    setCommentLoading(true);
    try {
      await addComment(id, commentText.trim(), commentAuthor.trim());
      setCommentText('');
      setSuccessMsg('Comment added.');
      await loadTicket();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingComment?.text?.trim()) return;
    setCommentLoading(true);
    try {
      await editComment(id, commentId, editingComment.text, currentUser);
      setEditingComment(null);
      setSuccessMsg('Comment updated.');
      await loadTicket();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to edit comment. Only the original author can edit.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(id, commentId, currentUser);
      setSuccessMsg('Comment deleted.');
      await loadTicket();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete comment.');
    }
  };

  // ─── Delete Ticket ──────────────────────────────────────────────────────────

  const handleDeleteTicket = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this ticket? This cannot be undone.')) return;
    try {
      await deleteTicket(id);
      navigate('/tickets', { state: { success: 'Ticket deleted.' } });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete ticket.');
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="tickets-page">
      <div className="loading-spinner"><div className="spinner" /></div>
    </div>
  );

  if (error && !ticket) return (
    <div className="tickets-page">
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/tickets')}>← Back to Tickets</button>
        </div>
      </div>
    </div>
  );

  const availableActions = STATUS_ACTIONS[ticket.status] || [];

  return (
    <div className="tickets-page">
      {/* Status Update Modal */}
      {statusModal && (
        <ReasonModal
          title={`Update status to ${statusModal.nextStatus.replace('_', ' ')}`}
          placeholder={statusModal.nextStatus === 'REJECTED'
            ? 'Enter rejection reason (required)...'
            : 'Enter resolution notes (optional)...'}
          required={statusModal.needsReason}
          onConfirm={(reason) => doStatusUpdate(statusModal.nextStatus, reason)}
          onCancel={() => setStatusModal(null)}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}
          onClick={() => navigate('/tickets')}
        >
          ← Back to Tickets
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.25rem' }}>
              TICKET #{ticket.id}
            </div>
            <h1 style={{ fontSize: '1.5rem' }}>{ticket.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusBadge status={ticket.status} />
            {ticket.escalated && (
              <span className="escalated-badge">⚡ AUTO-ESCALATED</span>
            )}
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Toast messages */}
        {successMsg && (
          <div style={{
            background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46',
            padding: '0.85rem 1rem', borderRadius: '9px', marginBottom: '1rem',
            fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            ✓ {successMsg}
          </div>
        )}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
            padding: '0.85rem 1rem', borderRadius: '9px', marginBottom: '1rem',
            fontSize: '0.875rem',
          }}>
            ⚠️ {error}
            <button
              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}
              onClick={() => setError('')}
            >✕</button>
          </div>
        )}

        <div className="ticket-detail-layout">
          {/* ── Left Column: Main Content ─────────────────────────── */}
          <div>
            {/* SLA Timer */}
            <SLATimer ticket={ticket} />

            {/* Description */}
            <div className="detail-card">
              <div className="detail-card-header">📋 Description</div>
              <div className="detail-card-body">
                <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--gray-700)', fontSize: '0.95rem' }}>
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="detail-card">
              <div className="detail-card-header">ℹ️ Ticket Details</div>
              <div className="detail-card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <label>Category</label>
                    <span>{categoryLabel(ticket.category)}</span>
                  </div>
                  <div className="info-item">
                    <label>Priority</label>
                    <span><PriorityBadge priority={ticket.priority} /></span>
                  </div>
                  <div className="info-item">
                    <label>Resource</label>
                    <span>{ticket.resourceName || '—'}</span>
                  </div>
                  <div className="info-item">
                    <label>Location</label>
                    <span>{ticket.location || '—'}</span>
                  </div>
                  <div className="info-item">
                    <label>Reported By</label>
                    <span>{ticket.reportedBy}</span>
                  </div>
                  <div className="info-item">
                    <label>Preferred Contact</label>
                    <span>{ticket.preferredContact || '—'}</span>
                  </div>
                  <div className="info-item">
                    <label>Assigned To</label>
                    <span>{ticket.assignedTo || 'Unassigned'}</span>
                  </div>
                  <div className="info-item">
                    <label>Created</label>
                    <span>{formatDateTime(ticket.createdAt)}</span>
                  </div>
                  {ticket.resolvedAt && (
                    <div className="info-item">
                      <label>Resolved At</label>
                      <span>{formatDateTime(ticket.resolvedAt)}</span>
                    </div>
                  )}
                  {ticket.closedAt && (
                    <div className="info-item">
                      <label>Closed At</label>
                      <span>{formatDateTime(ticket.closedAt)}</span>
                    </div>
                  )}
                </div>

                {ticket.resolutionNotes && (
                  <div style={{
                    marginTop: '1rem', padding: '0.85rem', background: '#ecfdf5',
                    borderRadius: '9px', border: '1px solid #6ee7b7',
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', marginBottom: '0.3rem' }}>
                      ✓ RESOLUTION NOTES
                    </div>
                    <p style={{ margin: 0, color: '#064e3b', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      {ticket.resolutionNotes}
                    </p>
                  </div>
                )}

                {ticket.rejectionReason && (
                  <div style={{
                    marginTop: '1rem', padding: '0.85rem', background: '#fef2f2',
                    borderRadius: '9px', border: '1px solid #fecaca',
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.3rem' }}>
                      ✕ REJECTION REASON
                    </div>
                    <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      {ticket.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="detail-card">
              <div className="detail-card-header">
                📎 Attachments
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--gray-400)', fontWeight: 400 }}>
                  {(ticket.attachments || []).length}/3 uploaded
                </span>
              </div>
              <div className="detail-card-body">
                {ticket.attachments?.length > 0 && (
                  <div className="attachment-list" style={{ marginBottom: '1rem' }}>
                    {ticket.attachments.map(att => (
                      <div key={att.id} className="attachment-item">
                        <span className="attachment-icon">{getFileIcon(att.contentType)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <a
                            href={`http://localhost:8081${att.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="attachment-name"
                            style={{ display: 'block', color: 'var(--sliit-blue)', textDecoration: 'none' }}
                          >
                            {att.fileName}
                          </a>
                          <span className="attachment-size">
                            {formatFileSize(att.fileSize)} · {att.uploadedBy}
                          </span>
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--priority-critical)', fontSize: '0.8rem' }}
                          onClick={() => handleDeleteAttachment(att.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(ticket.attachments || []).length < 3 &&
                  !['CLOSED', 'REJECTED'].includes(ticket.status) && (
                  <div className="attachment-upload-area">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                    <div style={{ pointerEvents: 'none' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {uploadingFile ? '⏳' : '📤'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                        {uploadingFile
                          ? 'Uploading...'
                          : 'Click or drag to upload evidence (image/PDF, max 10MB)'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="detail-card">
              <div className="detail-card-header">
                💬 Comments
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--gray-400)', fontWeight: 400 }}>
                  {(ticket.comments || []).length} comment{(ticket.comments || []).length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="detail-card-body">
                {ticket.comments?.length === 0 && (
                  <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem', margin: 0 }}>
                    No comments yet. Be the first to add an update.
                  </p>
                )}

                <div className="comment-list">
                  {(ticket.comments || []).map(c => (
                    <div key={c.id} className="comment-item">
                      <div className="comment-avatar">
                        {c.commentedBy?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className={`comment-bubble ${c.commentedBy === currentUser ? 'own' : ''}`}>
                        <div className="comment-author">
                          {c.commentedBy}
                          {c.isEdited && (
                            <span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                              (edited)
                            </span>
                          )}
                          <span className="comment-time">
                            {new Date(c.createdAt).toLocaleString('en-GB', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {editingComment?.id === c.id ? (
                          <div>
                            <textarea
                              value={editingComment.text}
                              onChange={e => setEditingComment(prev => ({ ...prev, text: e.target.value }))}
                              style={{
                                width: '100%', padding: '0.5rem', border: '1px solid var(--sliit-blue)',
                                borderRadius: '7px', fontSize: '0.875rem', fontFamily: 'inherit',
                                resize: 'vertical', minHeight: '60px', outline: 'none', boxSizing: 'border-box',
                              }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                              <button className="btn btn-primary btn-sm" onClick={() => handleEditComment(c.id)} disabled={commentLoading}>
                                Save
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingComment(null)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="comment-text">{c.comment}</p>
                            <div className="comment-actions">
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                                onClick={() => setEditingComment({ id: c.id, text: c.comment })}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: 'var(--priority-critical)' }}
                                onClick={() => handleDeleteComment(c.id)}
                              >
                                🗑 Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add comment form */}
                {!['CLOSED', 'REJECTED'].includes(ticket.status) && (
                  <div className="comment-add-form">
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        placeholder="Your name or email"
                        value={commentAuthor}
                        onChange={e => setCommentAuthor(e.target.value)}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid var(--gray-300)',
                          borderRadius: '8px', marginBottom: '0.5rem', fontSize: '0.85rem',
                          outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                        }}
                      />
                      <textarea
                        placeholder="Add a comment or update..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ alignSelf: 'flex-end' }}
                      onClick={handleAddComment}
                      disabled={commentLoading || !commentText.trim() || !commentAuthor.trim()}
                    >
                      {commentLoading ? '⏳' : 'Post'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column: Actions ─────────────────────────────── */}
          <div>
            {/* Status Actions */}
            {availableActions.length > 0 && (
              <div className="detail-card" style={{ marginBottom: '1.25rem' }}>
                <div className="detail-card-header">⚡ Actions</div>
                <div className="detail-card-body">
                  <div className="status-actions">
                    {availableActions.map(action => (
                      <button
                        key={action.nextStatus}
                        className={`btn ${action.style} status-action-btn`}
                        onClick={() => handleStatusAction(action)}
                        disabled={actionLoading}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Assign Technician */}
            {!['CLOSED', 'REJECTED', 'RESOLVED'].includes(ticket.status) && (
              <div className="detail-card" style={{ marginBottom: '1.25rem' }}>
                <div className="detail-card-header">👷 Assign Technician</div>
                <div className="detail-card-body">
                  {ticket.assignedTo ? (
                    <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                      Currently: <strong>{ticket.assignedTo}</strong>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
                      No technician assigned yet
                    </div>
                  )}

                  {showAssignForm ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Technician email"
                        value={assignInput}
                        onChange={e => setAssignInput(e.target.value)}
                        style={{
                          flex: 1, padding: '0.55rem 0.75rem', border: '1.5px solid var(--gray-300)',
                          borderRadius: '8px', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleAssign()}
                      />
                      <button className="btn btn-primary btn-sm" onClick={handleAssign} disabled={actionLoading}>
                        ✓
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowAssignForm(false)}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-outline"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => setShowAssignForm(true)}
                    >
                      {ticket.assignedTo ? '↩ Reassign' : '+ Assign'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Ticket Info Summary */}
            <div className="detail-card" style={{ marginBottom: '1.25rem' }}>
              <div className="detail-card-header">📊 Summary</div>
              <div className="detail-card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Status</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Priority</span>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Comments</span>
                    <strong>{ticket.comments?.length || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Attachments</span>
                    <strong>{ticket.attachments?.length || 0}/3</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Last Updated</span>
                    <span style={{ fontSize: '0.8rem' }}>
                      {new Date(ticket.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="detail-card">
              <div className="detail-card-header" style={{ color: 'var(--priority-critical)' }}>
                ⚠️ Danger Zone
              </div>
              <div className="detail-card-body">
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
                  Permanently deletes this ticket and all its data.
                </p>
                <button
                  className="btn btn-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleDeleteTicket}
                >
                  🗑 Delete Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
