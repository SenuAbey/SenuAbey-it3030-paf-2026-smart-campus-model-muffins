import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchTicketById,
  updateTicketStatus,
  uploadAttachment,
  deleteAttachment,
  addComment,
  editComment,
  deleteComment,
  deleteTicket,
} from '../api/ticketApi';
import TechnicianAssignPanel from './TechnicianAssignPanel';
import RatingModal from './RatingModal';
import './tickets.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// Status workflow — which buttons show for each status (ADMIN only)
const STATUS_ACTIONS = {
  OPEN: [
    { label: '▶ Move to In Progress', nextStatus: 'IN_PROGRESS', style: 'btn-primary', needsReason: false },
    { label: '✕ Reject Ticket',       nextStatus: 'REJECTED',    style: 'btn-danger',  needsReason: true  },
    { label: '⊗ Close Ticket',        nextStatus: 'CLOSED',      style: 'btn-ghost',   needsReason: false },
  ],
  IN_PROGRESS: [
    { label: '✓ Mark as Resolved', nextStatus: 'RESOLVED', style: 'btn-primary', needsReason: false, reasonLabel: 'Resolution notes (optional)' },
    { label: '✕ Reject Ticket',    nextStatus: 'REJECTED', style: 'btn-danger',  needsReason: true  },
  ],
  RESOLVED: [
    { label: '⊗ Close Ticket',          nextStatus: 'CLOSED',      style: 'btn-primary', needsReason: false },
    { label: '↩ Re-open (In Progress)', nextStatus: 'IN_PROGRESS', style: 'btn-ghost',   needsReason: false },
  ],
};

// ─── Small sub-components ─────────────────────────────────────────────────────

function SLATimer({ ticket }) {
  const [hours, setHours] = useState(0);

  useEffect(() => {
    const calc = () => {
      if (!ticket.createdAt) return;
      const start = new Date(ticket.createdAt).getTime();
      const end   = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : Date.now();
      setHours(Math.floor((end - start) / 3600000));
    };
    calc();
    const interval = !ticket.resolvedAt ? setInterval(calc, 60000) : null;
    return () => interval && clearInterval(interval);
  }, [ticket]);

  const thresholds = { LOW: 72, MEDIUM: 48, HIGH: 24, CRITICAL: 8 };
  const target     = thresholds[ticket.priority] || 48;
  const overdue    = hours > target && !['RESOLVED', 'CLOSED', 'REJECTED'].includes(ticket.status);

  return (
    <div className={`sla-timer ${overdue ? 'overdue' : ''}`}>
      <div>
        <div className="sla-hours">{hours}h</div>
        <div className="sla-label">{ticket.resolvedAt ? 'Time to resolve' : 'Open duration'}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: overdue ? 'var(--danger)' : 'var(--sliit-blue)', marginBottom: 3 }}>
          {overdue ? '⚠️ SLA Exceeded' : '✓ Within SLA'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
          Target: {target}h for {ticket.priority} priority
        </div>
        {ticket.firstResponseAt && (
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
            First response: {Math.floor((new Date(ticket.firstResponseAt) - new Date(ticket.createdAt)) / 3600000)}h after creation
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    OPEN:        ['🔵', 'badge-status-OPEN'],
    IN_PROGRESS: ['🟡', 'badge-status-IN_PROGRESS'],
    RESOLVED:    ['🟢', 'badge-status-RESOLVED'],
    CLOSED:      ['⚫', 'badge-status-CLOSED'],
    REJECTED:    ['🔴', 'badge-status-REJECTED'],
  };
  const [icon, cls] = map[status] || ['', ''];
  return <span className={`badge ${cls}`}>{icon} {status?.replace('_', ' ')}</span>;
}

function PriorityBadge({ priority }) {
  const icons = { LOW: '▼', MEDIUM: '●', HIGH: '▲', CRITICAL: '🔥' };
  return <span className={`badge badge-priority-${priority}`}>{icons[priority]} {priority}</span>;
}

// Modal that asks for a reason/notes before confirming a status change
function ReasonModal({ title, placeholder, onConfirm, onCancel, required = false }) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{required ? 'A reason is required for this action.' : 'You can optionally add notes.'}</p>
        <textarea placeholder={placeholder} value={reason} onChange={e => setReason(e.target.value)} autoFocus />
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" disabled={required && !reason.trim()} onClick={() => onConfirm(reason)}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [ticket, setTicket]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.success || '');

  // Role toggle — USER or ADMIN (replaced by real auth when Module E done)
  const [role, setRole] = useState('USER');

  // Status action modal
  const [statusModal, setStatusModal]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Rating modal — shown after resolving a ticket that has an assigned technician
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Comment states
  const [commentText, setCommentText]     = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [commentLoading, setCommentLoading] = useState(false);

  // Attachment states
  const [uploadingFile, setUploadingFile] = useState(false);

  const currentUser = 'admin'; // replace with auth context when Module E integrated

  // ─── Load ticket ────────────────────────────────────────────────────────────

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

  useEffect(() => { loadTicket(); }, [loadTicket]);

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
      setSuccessMsg(`Status updated to ${nextStatus.replace('_', ' ')}`);
      await loadTicket();

      // Show rating modal when marking RESOLVED and a technician was assigned
      if (nextStatus === 'RESOLVED' && ticket?.assignedTo) {
        setShowRatingModal(true);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Attachments ────────────────────────────────────────────────────────────

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
      setError(e.response?.data?.message || 'Failed to edit comment.');
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
    if (!window.confirm('Permanently delete this ticket? This cannot be undone.')) return;
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

  if (!ticket) return (
    <div className="tickets-page">
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Ticket not found</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/tickets')}>← Back to Tickets</button>
        </div>
      </div>
    </div>
  );

  const availableActions = STATUS_ACTIONS[ticket.status] || [];

  return (
    <div className="tickets-page">

      {/* ── Status reason modal ─────────────────────────────────────────── */}
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

      {/* ── Rating modal — shown after RESOLVED when technician assigned ── */}
      {showRatingModal && ticket?.assignedTo && (
        <RatingModal
          ticket={ticket}
          onClose={() => setShowRatingModal(false)}
          onRated={() => {
            setSuccessMsg('Rating submitted — thank you!');
            setShowRatingModal(false);
          }}
        />
      )}

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', marginBottom: 10 }}
          onClick={() => navigate('/tickets')}
        >
          ← Back to Tickets
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 3 }}>TICKET #{ticket.id}</div>
            <h1 style={{ fontSize: '1.4rem' }}>{ticket.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusBadge status={ticket.status} />
            {ticket.escalated && <span className="escalated-badge">⚡ ESCALATED</span>}
          </div>
        </div>
      </div>

      <div className="page-content">

        {/* ── Toast messages ───────────────────────────────────────────── */}
        {successMsg && (
          <div className="toast-success">✓ {successMsg}</div>
        )}
        {error && (
          <div className="toast-error">
            ⚠️ {error}
            <button style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
              onClick={() => setError('')}>✕</button>
          </div>
        )}

        <div className="ticket-detail-layout">

          {/* ════════════════════════════════════════════════════════════
              LEFT COLUMN — main ticket content
          ════════════════════════════════════════════════════════════ */}
          <div>

            {/* SLA Timer */}
            <SLATimer ticket={ticket} />

            {/* Description */}
            <div className="detail-card">
              <div className="detail-card-header">📋 Description</div>
              <div className="detail-card-body">
                <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text)', fontSize: 14 }}>
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="detail-card">
              <div className="detail-card-header">ℹ️ Ticket Details</div>
              <div className="detail-card-body">
                <div className="info-grid">
                  <div className="info-item"><label>Category</label><span>{categoryLabel(ticket.category)}</span></div>
                  <div className="info-item"><label>Priority</label><span><PriorityBadge priority={ticket.priority} /></span></div>
                  <div className="info-item"><label>Resource</label><span>{ticket.resourceName || '—'}</span></div>
                  <div className="info-item"><label>Location</label><span>{ticket.location || '—'}</span></div>
                  <div className="info-item"><label>Reported By</label><span>{ticket.reportedBy}</span></div>
                  <div className="info-item"><label>Preferred Contact</label><span>{ticket.preferredContact || '—'}</span></div>
                  <div className="info-item"><label>Assigned To</label>
                    <span style={{ color: ticket.assignedTo ? 'var(--sliit-blue)' : 'var(--text-light)', fontWeight: ticket.assignedTo ? 600 : 400 }}>
                      {ticket.assignedTo || 'Unassigned'}
                    </span>
                  </div>
                  <div className="info-item"><label>Created</label><span>{formatDateTime(ticket.createdAt)}</span></div>
                  {ticket.resolvedAt && <div className="info-item"><label>Resolved At</label><span>{formatDateTime(ticket.resolvedAt)}</span></div>}
                  {ticket.closedAt   && <div className="info-item"><label>Closed At</label><span>{formatDateTime(ticket.closedAt)}</span></div>}
                </div>

                {/* Resolution notes */}
                {ticket.resolutionNotes && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--status-resolved-bg)', borderRadius: 8, border: '1px solid #6ee7b7' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>✓ RESOLUTION NOTES</div>
                    <p style={{ margin: 0, color: '#064e3b', fontSize: 13, lineHeight: 1.6 }}>{ticket.resolutionNotes}</p>
                  </div>
                )}

                {/* Rejection reason */}
                {ticket.rejectionReason && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--status-rejected-bg)', borderRadius: 8, border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>✕ REJECTION REASON</div>
                    <p style={{ margin: 0, color: '#7f1d1d', fontSize: 13, lineHeight: 1.6 }}>{ticket.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="detail-card">
              <div className="detail-card-header">
                📎 Attachments
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-light)', fontWeight: 400 }}>
                  {(ticket.attachments || []).length}/3
                </span>
              </div>
              <div className="detail-card-body">
                {ticket.attachments?.length > 0 && (
                  <div className="attachment-list" style={{ marginBottom: 12 }}>
                    {ticket.attachments.map(att => (
                      <div key={att.id} className="attachment-item">
                        <span style={{ fontSize: 20 }}>{getFileIcon(att.contentType)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <a href={`http://localhost:8081${att.fileUrl}`} target="_blank" rel="noopener noreferrer"
                            className="attachment-name" style={{ color: 'var(--sliit-blue)', textDecoration: 'none', display: 'block' }}>
                            {att.fileName}
                          </a>
                          <span className="attachment-size">{formatFileSize(att.fileSize)} · {att.uploadedBy}</span>
                        </div>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                          onClick={() => handleDeleteAttachment(att.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {(ticket.attachments || []).length < 3 && !['CLOSED', 'REJECTED'].includes(ticket.status) && (
                  <div className="attachment-upload-area">
                    <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={uploadingFile} />
                    <div style={{ pointerEvents: 'none' }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{uploadingFile ? '⏳' : '📤'}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                        {uploadingFile ? 'Uploading...' : 'Click or drag to upload (image/PDF, max 10MB)'}
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
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-light)', fontWeight: 400 }}>
                  {(ticket.comments || []).length} comment{(ticket.comments || []).length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="detail-card-body">
                {ticket.comments?.length === 0 && (
                  <p style={{ color: 'var(--text-light)', fontSize: 13, margin: 0 }}>
                    No comments yet. Add an update below.
                  </p>
                )}

                <div className="comment-list">
                  {(ticket.comments || []).map(c => (
                    <div key={c.id} className="comment-item">
                      <div className={`comment-avatar ${c.commentedBy === 'admin' ? 'admin' : ''}`}>
                        {c.commentedBy?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className={`comment-bubble ${c.commentedBy === currentUser ? 'own' : ''}`}>
                        <div className="comment-author">
                          {c.commentedBy}
                          {c.isEdited && <span style={{ fontWeight: 400, fontSize: 10, color: 'var(--text-light)' }}>(edited)</span>}
                          <span className="comment-time">
                            {new Date(c.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {editingComment?.id === c.id ? (
                          <div>
                            <textarea
                              value={editingComment.text}
                              onChange={e => setEditingComment(prev => ({ ...prev, text: e.target.value }))}
                              style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--sliit-blue)', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', minHeight: 60, outline: 'none', boxSizing: 'border-box' }}
                            />
                            <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                              <button className="btn btn-primary btn-sm" onClick={() => handleEditComment(c.id)} disabled={commentLoading}>Save</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingComment(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="comment-text">{c.comment}</p>
                            <div className="comment-actions">
                              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '2px 6px' }}
                                onClick={() => setEditingComment({ id: c.id, text: c.comment })}>✏️ Edit</button>
                              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '2px 6px', color: 'var(--danger)' }}
                                onClick={() => handleDeleteComment(c.id)}>🗑 Delete</button>
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
                        style={{ width: '100%', padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 8, marginBottom: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
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

          {/* ════════════════════════════════════════════════════════════
              RIGHT COLUMN — actions sidebar
          ════════════════════════════════════════════════════════════ */}
          <div>

            {/* Role toggle — remove when Module E OAuth integrated */}
            <div className="detail-card" style={{ marginBottom: 12 }}>
              <div className="detail-card-body" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>
                  View As
                </div>
                <div className="role-toggle">
                  <button className={`role-btn ${role === 'USER' ? 'active' : ''}`} onClick={() => setRole('USER')}>
                    👤 User
                  </button>
                  <button className={`role-btn ${role === 'ADMIN' ? 'active' : ''}`} onClick={() => setRole('ADMIN')}>
                    🛡 Admin
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>
                  {role === 'ADMIN'
                    ? 'Admin: can change status, assign technicians'
                    : 'User: can view and comment only'}
                </div>
              </div>
            </div>

            {/* ── ADMIN ONLY SECTION ───────────────────────────────── */}
            {role === 'ADMIN' && (
              <>
                {/* Status action buttons */}
                {availableActions.length > 0 && (
                  <div className="detail-card" style={{ marginBottom: 12 }}>
                    <div className="detail-card-header">⚡ Change Status</div>
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

                {/* Assign Technician — uses TechnicianAssignPanel */}
                {!['CLOSED', 'REJECTED', 'RESOLVED'].includes(ticket.status) && (
                  <div className="detail-card" style={{ marginBottom: 12 }}>
                    <div className="detail-card-header">
                      👷 Assign Technician
                      {ticket.assignedTo && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>
                          ✓ Assigned
                        </span>
                      )}
                    </div>
                    <div className="detail-card-body">
                      <TechnicianAssignPanel
                        ticket={ticket}
                        onAssigned={(tech) => {
                          setSuccessMsg(`Ticket assigned to ${tech.name} (${tech.email})`);
                          loadTicket();
                        }}
                        onError={(msg) => setError(msg)}
                      />
                    </div>
                  </div>
                )}

                {/* Rate technician button — shown when RESOLVED and technician was assigned */}
                {ticket.status === 'RESOLVED' && ticket.assignedTo && (
                  <div className="detail-card" style={{ marginBottom: 12 }}>
                    <div className="detail-card-header">⭐ Rate Technician</div>
                    <div className="detail-card-body">
                      <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 10 }}>
                        Rate the work done by <strong>{ticket.assignedTo}</strong>
                      </p>
                      <button
                        className="btn btn-orange"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => setShowRatingModal(true)}
                      >
                        ⭐ Submit Rating
                      </button>
                    </div>
                  </div>
                )}

                {/* Danger zone */}
                <div className="detail-card">
                  <div className="detail-card-header" style={{ color: 'var(--danger)' }}>⚠️ Danger Zone</div>
                  <div className="detail-card-body">
                    <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 10 }}>
                      Permanently deletes this ticket and all its data.
                    </p>
                    <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}
                      onClick={handleDeleteTicket}>
                      🗑 Delete Ticket
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Summary (visible to both USER and ADMIN) ──────────── */}
            <div className="detail-card" style={{ marginTop: role === 'ADMIN' ? 12 : 0 }}>
              <div className="detail-card-header">📊 Summary</div>
              <div className="detail-card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-light)' }}>Status</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-light)' }}>Priority</span>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-light)' }}>Assigned To</span>
                    <strong style={{ fontSize: 12 }}>{ticket.assignedTo || 'Unassigned'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-light)' }}>Comments</span>
                    <strong>{ticket.comments?.length || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-light)' }}>Attachments</span>
                    <strong>{ticket.attachments?.length || 0}/3</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-light)' }}>Last Updated</span>
                    <span style={{ fontSize: 11 }}>
                      {new Date(ticket.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
          {/* end right column */}
        </div>
      </div>
    </div>
  );
}
