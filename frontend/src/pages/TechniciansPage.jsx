import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllTechnicians, createTechnician,
  updateTechnician, deleteTechnician, fetchTechnicianRatings,
} from '../api/technicianApi';
import AppHeader from '../components/AppHeader';
import './tickets.css';

const CATEGORIES = [
  'ELECTRICAL','PLUMBING','HVAC','IT_EQUIPMENT',
  'FURNITURE','SAFETY','CLEANING','OTHER',
];

function Stars({ rating, size = 14 }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
      <span style={{ fontSize: size - 2, color: 'var(--text-light)', marginLeft: 4 }}>
        {rating > 0 ? rating.toFixed(1) : 'No ratings'}
      </span>
    </span>
  );
}

function WorkloadBadge({ count }) {
  const color = count === 0 ? 'var(--success)' : count < 4 ? 'var(--sliit-blue)' : count < 7 ? '#f59e0b' : 'var(--danger)';
  const label = count === 0 ? 'Free' : count < 4 ? 'Light' : count < 7 ? 'Moderate' : 'Heavy';
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color, background: color + '18', padding: '2px 8px', borderRadius: 20, border: `1px solid ${color}40` }}>
      {label} ({count})
    </span>
  );
}

function TechnicianFormModal({ tech, onSave, onClose }) {
  const [form, setForm] = useState({
    name: tech?.name || '',
    email: tech?.email || '',
    phone: tech?.phone || '',
    specializations: tech?.specializations || [],
    available: tech?.available ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const toggleCategory = (cat) => {
    setForm(prev => ({
      ...prev,
      specializations: prev.specializations.includes(cat)
        ? prev.specializations.filter(c => c !== cat)
        : [...prev.specializations, cat],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { setErr('Name and email are required.'); return; }
    if (form.specializations.length === 0) { setErr('Select at least one specialization.'); return; }
    setSaving(true); setErr('');
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <h3>{tech ? 'Edit Technician' : 'Add Technician'}</h3>
        <p>{tech ? 'Update technician details.' : 'Add a new technician to the team.'}</p>

        <div className="form-group">
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Full Name *</label>
          <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Kamal Perera" />
        </div>
        <div className="form-group">
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Email *</label>
          <input className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="e.g. kamal@sliit.lk" disabled={!!tech} />
        </div>
        <div className="form-group">
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Phone</label>
          <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="e.g. 0771234567" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Specializations * (select all that apply)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', border: '1.5px solid',
                  background: form.specializations.includes(cat) ? 'var(--sliit-blue)' : 'white',
                  color: form.specializations.includes(cat) ? 'white' : 'var(--text-light)',
                  borderColor: form.specializations.includes(cat) ? 'var(--sliit-blue)' : 'var(--border)',
                }}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <input type="checkbox" id="avail" checked={form.available} onChange={e => setForm(p => ({ ...p, available: e.target.checked }))} />
          <label htmlFor="avail" style={{ fontSize: 13, cursor: 'pointer' }}>Available for assignments</label>
        </div>

        {err && <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>⚠ {err}</div>}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saving...' : '✓ Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RatingHistoryModal({ tech, onClose }) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTechnicianRatings(tech.id)
      .then(setRatings)
      .catch(() => setRatings([]))
      .finally(() => setLoading(false));
  }, [tech.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3>⭐ Rating History — {tech.name}</h3>
        <p>All ratings received for completed tickets</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>Loading...</div>
        ) : ratings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-light)', fontSize: 13 }}>
            No ratings yet for this technician.
          </div>
        ) : (
          <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ratings.map(r => (
              <div key={r.id} style={{ padding: '10px 14px', background: '#f8f9fa', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Ticket #{r.ticketId}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-light)' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 20, marginBottom: r.feedback ? 6 : 0 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-light)', marginBottom: 2 }}>QUALITY</div>
                    <Stars rating={r.qualityScore} size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-light)', marginBottom: 2 }}>TIME</div>
                    <Stars rating={r.timeScore} size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-light)', marginBottom: 2 }}>OVERALL</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sliit-blue)' }}>{r.overallScore?.toFixed(1)}</span>
                  </div>
                </div>
                {r.feedback && (
                  <div style={{ fontSize: 12, color: 'var(--text-light)', fontStyle: 'italic', marginTop: 4 }}>
                    "{r.feedback}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TechniciansPage() {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [filterCat, setFilterCat]     = useState('');
  const [searchQ, setSearchQ]         = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [editTech, setEditTech]       = useState(null);
  const [viewRatings, setViewRatings] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllTechnicians();
      setTechnicians(data || []);
    } catch (e) {
      setError('Could not load technicians. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    await createTechnician(form);
    load();
  };

  const handleUpdate = async (form) => {
    await updateTechnician(editTech.id, form);
    load();
  };

  const handleDelete = async (tech) => {
    if (!window.confirm(`Delete technician ${tech.name}? This cannot be undone.`)) return;
    try {
      await deleteTechnician(tech.id);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Delete failed.');
    }
  };

  const filtered = technicians.filter(t => {
    const matchCat = !filterCat || (t.specializations || []).includes(filterCat);
    const matchQ   = !searchQ   || t.name.toLowerCase().includes(searchQ.toLowerCase()) ||
                     t.email.toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="tickets-page">
      {/* Modals */}
      {(showForm || editTech) && (
        <TechnicianFormModal
          tech={editTech}
          onSave={editTech ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditTech(null); }}
        />
      )}
      {viewRatings && (
        <RatingHistoryModal tech={viewRatings} onClose={() => setViewRatings(null)} />
      )}

      {/* Header */}
      <AppHeader />

      <div className="app-banner" style={{
        backgroundImage: "linear-gradient(rgba(0,51,102,0.88), rgba(0,83,160,0.88)), url('https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1200&q=80')",
      }}>
        <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Smart Campus Operations Hub
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '300', margin: '0 0 8px', color: '#fff' }}>
          Technician <strong style={{ fontWeight: '800' }}>Management</strong>
        </h1>
        <p style={{ opacity: 0.8, margin: 0, fontSize: '15px', color: '#fff' }}>
          Manage technician profiles, specializations, workload and ratings
        </p>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button className="btn btn-orange" onClick={() => { setEditTech(null); setShowForm(true); }}>
            + Add Technician
          </button>
        </div>
        {/* Summary stats */}
        <div className="stats-bar" style={{ marginBottom: '1.25rem' }}>
          <div className="stat-card">
            <div className="stat-value">{technicians.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card green">
            <div className="stat-value">{technicians.filter(t => t.available).length}</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-value">{technicians.reduce((s, t) => s + t.activeTicketCount, 0)}</div>
            <div className="stat-label">Active Tickets</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {technicians.length > 0
                ? (technicians.filter(t => t.averageRating > 0).reduce((s, t) => s + t.averageRating, 0) /
                   (technicians.filter(t => t.averageRating > 0).length || 1)).toFixed(1)
                : '—'}
            </div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-row">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
          </div>
          <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Specializations</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && <div className="toast-error">⚠️ {error}</div>}

        {/* Loading */}
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👷</div>
            <h3>No technicians found</h3>
            <p>Add technicians to start assigning tickets</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Technician</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(tech => (
              <div key={tech.id} className="detail-card" style={{ margin: 0 }}>
                <div className="detail-card-body">
                  {/* Profile header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--sliit-blue), var(--sliit-dark))',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 16, flexShrink: 0,
                      }}>
                        {tech.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{tech.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{tech.email}</div>
                        {tech.phone && <div style={{ fontSize: 11, color: 'var(--text-light)' }}>📞 {tech.phone}</div>}
                      </div>
                    </div>
                    <WorkloadBadge count={tech.activeTicketCount} />
                  </div>

                  {/* Rating */}
                  <div style={{ marginBottom: 10 }}>
                    <Stars rating={tech.averageRating} />
                    <span style={{ fontSize: 11, color: 'var(--text-light)', marginLeft: 6 }}>
                      ({tech.ratingCount} rating{tech.ratingCount !== 1 ? 's' : ''})
                    </span>
                  </div>

                  {/* Specializations */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {(tech.specializations || []).map(s => (
                      <span key={s} style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                        background: '#e8f0f9', color: 'var(--sliit-blue)', border: '1px solid #bdd0ea',
                      }}>
                        {s.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-light)', marginBottom: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <span>🔧 {tech.activeTicketCount} active</span>
                    <span>✓ {tech.completedTicketCount} completed</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: tech.available ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                      {tech.available ? '● Available' : '● Unavailable'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1 }}
                      onClick={() => setViewRatings(tech)}>
                      ⭐ Ratings
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}
                      onClick={() => setEditTech(tech)}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(tech)}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
<<<<<<< HEAD
=======
      <footer className="app-footer">
        © 2026 Smart Campus Operations Hub
      </footer>
>>>>>>> 60786c4bd4d542dc7667c70dea0e9201bb472e65
    </div>
  );
}
