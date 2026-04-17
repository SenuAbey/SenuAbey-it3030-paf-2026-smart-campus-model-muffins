import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchTickets, fetchTicketStats } from '../api/ticketApi';
import { RoleContext } from '../App';
import { useAuthStore } from '../store/authStore';
import './tickets.css';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const categoryLabel = (cat) => cat ? cat.replace(/_/g, ' ') : '—';

function StatusBadge({ status }) {
  const icons = { OPEN: '🔵', IN_PROGRESS: '🟡', RESOLVED: '🟢', CLOSED: '⚫', REJECTED: '🔴' };
  return (
    <span className={`badge badge-status-${status}`}>
      {icons[status]} {status?.replace('_', ' ')}
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
    <div className={`ticket-card status-${ticket.status}`} onClick={() => onClick(ticket.id)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span className="ticket-id">#{ticket.id}</span>
        {ticket.escalated && <span className="escalated-badge">⚡ ESCALATED</span>}
      </div>
      <h3 className="ticket-title">{ticket.title}</h3>
      <p className="ticket-desc">{ticket.description}</p>
      <div className="ticket-meta">
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        <span className="badge badge-category">{categoryLabel(ticket.category)}</span>
      </div>
      <div className="ticket-footer">
        <span>📍 {ticket.location || ticket.resourceName || 'No location'}</span>
        <span style={{ display: 'flex', gap: 8 }}>
          {ticket.commentCount > 0 && <span>💬 {ticket.commentCount}</span>}
          {ticket.attachmentCount > 0 && <span>📎 {ticket.attachmentCount}</span>}
          <span>{timeAgo(ticket.createdAt)}</span>
        </span>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Real role from OAuth login — no toggle needed
  const { role } = useContext(RoleContext);
  const { user, logoutUser } = useAuthStore();
  const isAdmin = role === 'ADMIN';

  const [tickets, setTickets]           = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [totalPages, setTotalPages]     = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filters, setFilters] = useState({
    status:   searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    priority: searchParams.get('priority') || '',
    keyword:  searchParams.get('keyword') || '',
    page: 0,
    size: 12,
  });

  const loadStats = useCallback(async () => {
    if (!isAdmin) return; // only admins need stats bar
    try {
      const data = await fetchTicketStats();
      setStats(data);
    } catch (e) {
      console.warn('Stats load failed:', e.message);
    }
  }, [isAdmin]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: filters.page,
        size: filters.size,
        sortBy: 'createdAt',
        sortDir: 'desc',
      };
      if (filters.status)   params.status   = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (filters.keyword)  params.keyword  = filters.keyword;

      // USER role: filter to only their own tickets by email
      if (!isAdmin && user?.email) {
        params.reportedBy = user.email;
      }

      const data = await fetchTickets(params);
      setTickets(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (e) {
      if (e.code === 'ERR_NETWORK' || e.message?.includes('Network')) {
        setError('Cannot connect to server. Make sure the backend is running on port 8081.');
      } else {
        setError(`Error: ${e.response?.data?.message || e.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin, user?.email]);

  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => { loadStats();   }, [loadStats]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 0 }));
  };

  const clearFilters = () => {
    setFilters(prev => ({ ...prev, status: '', category: '', priority: '', keyword: '', page: 0 }));
    setSearchParams({});
  };

  const hasFilters = filters.status || filters.category || filters.priority || filters.keyword;

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="tickets-page">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>🔧 Incident Tickets</h1>
            <p>Report and track maintenance issues across campus facilities</p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* User info chip */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.15)', borderRadius: 20,
                padding: '4px 10px 4px 4px', border: '1px solid rgba(255,255,255,0.3)' }}>
                {user.profilePicture
                  ? <img src={user.profilePicture} alt="avatar"
                      style={{ width: 26, height: 26, borderRadius: '50%' }} />
                  : <div style={{ width: 26, height: 26, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.3)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff' }}>
                      {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                    </div>
                }
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
                  {user.name || user.email}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                  background: isAdmin ? '#E87722' : '#1D9E75', color: '#fff',
                }}>
                  {role}
                </span>
              </div>
            )}

            <button className="btn btn-orange" onClick={() => navigate('/tickets/new')}>
              + New Ticket
            </button>

            {isAdmin && (
              <button
                className="btn btn-ghost"
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
                onClick={() => navigate('/tickets/stats')}
              >
                📊 Dashboard
              </button>
            )}

            <button
              className="btn btn-ghost"
              style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
              onClick={() => navigate('/')}
            >
              🏠 Campus Hub
            </button>

            <button
              className="btn btn-ghost"
              style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* ── Role banner ─────────────────────────────────────────────── */}
        <div className={`role-banner ${isAdmin ? 'admin' : 'user'}`}>
          {isAdmin
            ? `🛡 Admin View — you can see all tickets, change status, and assign technicians`
            : `👤 User View — showing tickets reported by ${user?.email || 'you'}`}
        </div>

        {/* ── Stats bar (admin only) ───────────────────────────────────── */}
        {isAdmin && stats && (
          <div className="stats-bar">
            <div className="stat-card">
              <div className="stat-value">{stats.totalTickets ?? 0}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-value">{stats.openTickets ?? 0}</div>
              <div className="stat-label">Open</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.inProgressTickets ?? 0}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card green">
              <div className="stat-value">{stats.resolvedTickets ?? 0}</div>
              <div className="stat-label">Resolved</div>
            </div>
            <div className="stat-card red">
              <div className="stat-value">{stats.byPriority?.CRITICAL ?? 0}</div>
              <div className="stat-label">Critical</div>
            </div>
          </div>
        )}

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="filters-row">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={filters.keyword}
              onChange={e => handleFilterChange('keyword', e.target.value)}
            />
          </div>
          <select className="filter-select" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select className="filter-select" value={filters.priority} onChange={e => handleFilterChange('priority', e.target.value)}>
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select className="filter-select" value={filters.category} onChange={e => handleFilterChange('category', e.target.value)}>
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
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear</button>
          )}
        </div>

        {/* ── Results count ───────────────────────────────────────────── */}
        {!loading && !error && (
          <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-light)' }}>
            {totalElements} ticket{totalElements !== 1 ? 's' : ''} found
            {hasFilters && ' (filtered)'}
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <h3>Connection Error</h3>
            <p>{error}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={loadTickets}>🔄 Retry</button>
              <button className="btn btn-ghost" onClick={() => window.open('http://localhost:8081/api/v1/tickets', '_blank')}>
                Test API
              </button>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <h3>{hasFilters ? 'No tickets match your filters' : 'No tickets yet'}</h3>
            <p>{hasFilters ? 'Try clearing filters' : 'Campus is running smoothly!'}</p>
            {hasFilters
              ? <button className="btn btn-ghost" onClick={clearFilters}>Clear Filters</button>
              : <button className="btn btn-orange" onClick={() => navigate('/tickets/new')}>Report an Issue</button>
            }
          </div>
        ) : (
          <>
            <div className="tickets-grid">
              {tickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={id => navigate(`/tickets/${id}`)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={filters.page === 0} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={filters.page === i ? 'active' : ''}
                    onClick={() => setFilters(p => ({ ...p, page: i }))}
                  >
                    {i + 1}
                  </button>
                ))}
                <button disabled={filters.page >= totalPages - 1} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>
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
