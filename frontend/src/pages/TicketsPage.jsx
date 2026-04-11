import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchTickets, fetchTicketStats } from '../api/ticketApi';
import './tickets.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const categoryLabel = (cat) =>
  cat ? cat.replace(/_/g, ' ') : '—';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const icons = {
    OPEN: '🔵', IN_PROGRESS: '🟡', RESOLVED: '🟢', CLOSED: '⚫', REJECTED: '🔴',
  };
  return (
    <span className={`badge badge-status-${status}`}>
      {icons[status] || ''} {status?.replace('_', ' ')}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const icons = { LOW: '▼', MEDIUM: '●', HIGH: '▲', CRITICAL: '🔥' };
  return (
    <span className={`badge badge-priority-${priority}`}>
      {icons[priority]} {priority}
    </span>
  );
}

function TicketCard({ ticket, onClick }) {
  return (
    <div
      className={`ticket-card status-${ticket.status}`}
      onClick={() => onClick(ticket.id)}
    >
      <div className="ticket-card-header">
        <span className="ticket-id">#{ticket.id}</span>
        {ticket.escalated && (
          <span className="escalated-badge">⚡ ESCALATED</span>
        )}
      </div>

      <h3 className="ticket-title">{ticket.title}</h3>
      <p className="ticket-desc">{ticket.description}</p>

      <div className="ticket-meta">
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        <span className="badge badge-category">{categoryLabel(ticket.category)}</span>
      </div>

      <div className="ticket-footer">
        <span>
          {ticket.resourceName
            ? `📍 ${ticket.resourceName}`
            : ticket.location
            ? `📍 ${ticket.location}`
            : '📍 No resource'}
        </span>
        <span style={{ display: 'flex', gap: '0.75rem' }}>
          {ticket.commentCount > 0 && (
            <span>💬 {ticket.commentCount}</span>
          )}
          {ticket.attachmentCount > 0 && (
            <span>📎 {ticket.attachmentCount}</span>
          )}
          <span>{timeAgo(ticket.createdAt)}</span>
        </span>
      </div>
    </div>
  );
}

function StatCard({ value, label, className = '' }) {
  return (
    <div className={`stat-card ${className}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter state — read from URL params for shareable links
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    priority: searchParams.get('priority') || '',
    keyword: searchParams.get('keyword') || '',
    page: parseInt(searchParams.get('page') || '0'),
    size: 12,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchTicketStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (filters.keyword) params.keyword = filters.keyword;
      params.page = filters.page;
      params.size = filters.size;
      params.sortBy = filters.sortBy;
      params.sortDir = filters.sortDir;

      const data = await fetchTickets(params);
      setTickets(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (e) {
      setError('Failed to load tickets. Make sure the backend is running on port 8081.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 0 }));
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters(prev => ({
      ...prev, status: '', category: '', priority: '', keyword: '', page: 0,
    }));
    setSearchParams({});
  };

  const hasActiveFilters = filters.status || filters.category || filters.priority || filters.keyword;

  return (
    <div className="tickets-page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>🔧 Incident Tickets</h1>
            <p>Report and track maintenance issues across campus facilities</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-orange"
              onClick={() => navigate('/tickets/new')}
            >
              + New Ticket
            </button>
            <button
              className="btn btn-outline"
              style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              onClick={() => navigate('/tickets/stats')}
            >
              📊 Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        {stats && (
          <div className="stats-bar">
            <StatCard value={stats.totalTickets ?? 0} label="Total" />
            <StatCard value={stats.openTickets ?? 0} label="Open" className="orange" />
            <StatCard value={stats.inProgressTickets ?? 0} label="In Progress" />
            <StatCard value={stats.resolvedTickets ?? 0} label="Resolved" className="green" />
            <StatCard
              value={stats.byStatus?.CRITICAL ?? stats.byPriority?.CRITICAL ?? 0}
              label="Critical"
              className="red"
            />
          </div>
        )}

        {/* Filters */}
        <div className="filters-row">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search tickets by title or description..."
              value={filters.keyword}
              onChange={e => handleFilterChange('keyword', e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            className="filter-select"
            value={filters.priority}
            onChange={e => handleFilterChange('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select
            className="filter-select"
            value={filters.category}
            onChange={e => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="HVAC">HVAC</option>
            <option value="IT_EQUIPMENT">IT Equipment</option>
            <option value="FURNITURE">Furniture</option>
            <option value="SAFETY">Safety</option>
            <option value="CLEANING">Cleaning</option>
            <option value="OTHER">Other</option>
          </select>

          {hasActiveFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
            {totalElements} ticket{totalElements !== 1 ? 's' : ''} found
            {hasActiveFilters && ' (filtered)'}
          </div>
        )}

        {/* Tickets grid */}
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <h3>Connection Error</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadTickets}>Retry</button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <h3>No tickets found</h3>
            <p>
              {hasActiveFilters
                ? 'No tickets match your current filters.'
                : 'No incidents reported yet. Campus is running smoothly!'}
            </p>
            {hasActiveFilters ? (
              <button className="btn btn-ghost" onClick={clearFilters}>Clear Filters</button>
            ) : (
              <button className="btn btn-orange" onClick={() => navigate('/tickets/new')}>
                Report an Issue
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="tickets-grid">
              {tickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={(id) => navigate(`/tickets/${id}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={filters.page === 0}
                  onClick={() => handlePageChange(filters.page - 1)}
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pageNum = filters.page < 4
                    ? i
                    : filters.page + i - 3;
                  if (pageNum >= totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      className={filters.page === pageNum ? 'active' : ''}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  disabled={filters.page >= totalPages - 1}
                  onClick={() => handlePageChange(filters.page + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
