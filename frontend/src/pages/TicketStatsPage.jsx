import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTicketStats } from '../api/ticketApi';
import { RoleContext } from '../App';
import { useAuthStore } from '../store/authStore';
import AppHeader from '../components/AppHeader';
import './tickets.css';

// Simple bar chart component (no external library needed)
function BarChart({ data, colorMap, title }) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-500)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--gray-600)', fontWeight: 500 }}>
                {key.replace(/_/g, ' ')}
              </span>
              <span style={{ color: 'var(--gray-800)', fontWeight: 700 }}>{value}</span>
            </div>
            <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '99px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(value / max) * 100}%`,
                  background: colorMap[key] || 'var(--sliit-blue)',
                  borderRadius: '99px',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Donut-style ring for status overview
function StatusRing({ byStatus, total }) {
  const colors = {
    OPEN: '#3b82f6',
    IN_PROGRESS: '#f59e0b',
    RESOLVED: '#10b981',
    CLOSED: '#6b7280',
    REJECTED: '#ef4444',
  };

  return (
    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
        <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
          {(() => {
            let offset = 0;
            return Object.entries(byStatus).map(([status, count]) => {
              const pct = total > 0 ? (count / total) * 100 : 0;
              const el = (
                <circle
                  key={status}
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke={colors[status] || '#ccc'}
                  strokeWidth="3.5"
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += pct;
              return el;
            });
          })()}
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sliit-blue)' }}>{total}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--gray-400)', fontWeight: 600 }}>TOTAL</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {Object.entries(byStatus).map(([status, count]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[status] || '#ccc', flexShrink: 0 }} />
            <span style={{ color: 'var(--gray-600)', flex: 1 }}>{status.replace('_', ' ')}</span>
            <span style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TicketStatsPage() {
  const navigate = useNavigate();
  const { role } = useContext(RoleContext);
  const { user } = useAuthStore();
  const isAdmin = role === 'ADMIN';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect non-admins away immediately
    if (!isAdmin) {
      navigate('/tickets');
      return;
    }
    fetchTicketStats()
      .then(setStats)
      .catch(() => setError('Failed to load statistics.'))
      .finally(() => setLoading(false));
  }, [isAdmin, navigate]);

  const priorityColors = {
    LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444',
  };
  const categoryColors = {
    ELECTRICAL: '#6366f1', PLUMBING: '#3b82f6', HVAC: '#06b6d4',
    IT_EQUIPMENT: '#8b5cf6', FURNITURE: '#f59e0b', SAFETY: '#ef4444',
    CLEANING: '#10b981', OTHER: '#6b7280',
  };

  return (
    <div className="tickets-page">
      <AppHeader />

      <div className="app-banner" style={{
        backgroundImage: "linear-gradient(rgba(0,51,102,0.88), rgba(0,83,160,0.88)), url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80')",
      }}>
        <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Smart Campus Operations Hub
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '300', margin: '0 0 8px', color: '#fff' }}>
          Ticket <strong style={{ fontWeight: '800' }}>Dashboard</strong>
        </h1>
        <p style={{ opacity: 0.8, margin: 0, fontSize: '15px', color: '#fff' }}>
          Maintenance &amp; incident overview for Smart Campus Operations
        </p>
      </div>

      <div className="page-content">
        {loading && <div className="loading-spinner"><div className="spinner" /></div>}
        {error && <div className="empty-state"><div className="empty-state-icon">⚠️</div><h3>{error}</h3></div>}

        {stats && (
          <>
            {/* KPI row */}
            <div className="stats-bar" style={{ marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Tickets', value: stats.totalTickets, cls: '' },
                { label: 'Open', value: stats.openTickets, cls: 'orange' },
                { label: 'In Progress', value: stats.inProgressTickets, cls: '' },
                { label: 'Resolved', value: stats.resolvedTickets, cls: 'green' },
                { label: 'Critical Priority', value: stats.byPriority?.CRITICAL || 0, cls: 'red' },
              ].map(({ label, value, cls }) => (
                <div key={label} className={`stat-card ${cls}`}>
                  <span className="stat-value">{value}</span>
                  <span className="stat-label">{label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {/* Status Overview */}
              <div className="detail-card">
                <div className="detail-card-header">🔵 Status Overview</div>
                <div className="detail-card-body">
                  <StatusRing byStatus={stats.byStatus || {}} total={stats.totalTickets || 0} />
                </div>
              </div>

              {/* By Priority */}
              <div className="detail-card">
                <div className="detail-card-header">🔥 By Priority</div>
                <div className="detail-card-body">
                  <BarChart data={stats.byPriority || {}} colorMap={priorityColors} title="Ticket Count" />
                </div>
              </div>

              {/* By Category */}
              <div className="detail-card" style={{ gridColumn: 'span 2' }}>
                <div className="detail-card-header">🗂 By Category</div>
                <div className="detail-card-body">
                  <BarChart data={stats.byCategory || {}} colorMap={categoryColors} title="Ticket Count" />
                </div>
              </div>

              {/* Technician Workload */}
              {Object.keys(stats.technicianWorkload || {}).length > 0 && (
                <div className="detail-card" style={{ gridColumn: 'span 2' }}>
                  <div className="detail-card-header">👷 Technician Workload (Active Tickets)</div>
                  <div className="detail-card-body">
                    <BarChart
                      data={stats.technicianWorkload}
                      colorMap={{}}
                      title="Active ticket count per technician"
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button className="btn btn-primary" onClick={() => navigate('/tickets/new')}>
                + Report New Incident
              </button>
            </div>
          </>
        )}
      </div>
      <footer className="app-footer">
        © 2026 Smart Campus Operations Hub
      </footer>
    </div>
  );
}
