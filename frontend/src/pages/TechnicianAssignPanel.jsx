import { useState, useEffect } from 'react';
import { fetchTechniciansByCategory, fetchAllTechnicians } from '../api/technicianApi';
import { assignTechnician } from '../api/ticketApi';

function Stars({ rating }) {
  return (
    <span style={{ fontSize: 13 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
      <span style={{ fontSize: 11, color: 'var(--text-light)', marginLeft: 4 }}>
        {rating > 0 ? rating.toFixed(1) : 'No ratings'}
      </span>
    </span>
  );
}

function WorkloadBar({ active }) {
  const max   = 10;
  const pct   = Math.min((active / max) * 100, 100);
  const color = pct < 40 ? '#1D9E75' : pct < 70 ? '#f59e0b' : '#E24B4A';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-light)', marginBottom: 3 }}>
        <span>Workload</span>
        <span>{active} active ticket{active !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ height: 5, background: '#e5e7eb', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

export default function TechnicianAssignPanel({ ticket, onAssigned, onError }) {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [assigning, setAssigning]     = useState(false);
  const [localError, setLocalError]   = useState('');
  const [showAll, setShowAll]         = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLocalError('');
      try {
        let data = [];
        if (ticket?.category) {
          data = await fetchTechniciansByCategory(ticket.category);
        }
        if (!data || data.length === 0) {
          data = await fetchAllTechnicians();
          setShowAll(true);
        }
        setTechnicians(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load technicians:', e);
        setLocalError('Could not load technicians. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ticket?.category]);

  const handleAssign = async () => {
    if (!selected) return;

    setAssigning(true);
    setLocalError('');

    try {
      // Send both technicianId AND assignedTo (email) so backend can use either
      const body = {
        technicianId: selected.id,
        assignedTo:   selected.email,
      };

      console.log('Assigning ticket', ticket.id, 'with body:', body);
      await assignTechnician(ticket.id, body);

      setSelected(null);
      onAssigned && onAssigned(selected);
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to assign technician.';
      console.error('Assign error:', e);
      setLocalError(msg);
      onError && onError(msg);
    } finally {
      setAssigning(false);
    }
  };

  const loadAll = async () => {
    try {
      const data = await fetchAllTechnicians();
      setTechnicians(Array.isArray(data) ? data : []);
      setShowAll(true);
    } catch (e) {
      setLocalError('Failed to load all technicians.');
    }
  };

  if (loading) return (
    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontSize: 13 }}>
      ⏳ Loading technicians...
    </div>
  );

  return (
    <div>
      {/* Filter label */}
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-light)' }}>
        {showAll
          ? 'Showing all technicians'
          : `Filtered by: ${ticket?.category?.replace(/_/g, ' ')} specialists`}
      </div>

      {/* Current assignee notice */}
      {ticket?.assignedTo && (
        <div style={{ padding: '7px 12px', background: '#e8f0f9', borderRadius: 8, fontSize: 12, marginBottom: 10, border: '1px solid #bdd0ea' }}>
          Currently assigned: <strong>{ticket.assignedTo}</strong>
        </div>
      )}

      {/* Local error */}
      {localError && (
        <div style={{ padding: '7px 12px', background: '#fef2f2', borderRadius: 8, fontSize: 12, marginBottom: 10, border: '1px solid #fecaca', color: '#b91c1c' }}>
          ⚠️ {localError}
        </div>
      )}

      {/* Technician list */}
      {technicians.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-light)', fontSize: 13 }}>
          No technicians found.
          <br />
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={loadAll}>
            Show All Technicians
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto', paddingRight: 2 }}>
          {technicians.map(tech => {
            const isSelected = selected?.id === tech.id;
            return (
              <div
                key={tech.id}
                onClick={() => setSelected(isSelected ? null : tech)}
                style={{
                  padding: '11px 13px',
                  border: `2px solid ${isSelected ? 'var(--sliit-blue)' : 'var(--border)'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: isSelected ? '#e8f0f9' : 'white',
                  transition: 'all 0.15s',
                  userSelect: 'none',
                }}
              >
                {/* Name + rating row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                      {tech.name}
                      {!tech.available && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: '#fef2f2', color: '#b91c1c', padding: '1px 5px', borderRadius: 20, fontWeight: 600 }}>
                          UNAVAILABLE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{tech.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Stars rating={tech.averageRating} />
                    <div style={{ fontSize: 10, color: 'var(--text-light)' }}>
                      {tech.ratingCount} review{tech.ratingCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Specialization tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 7 }}>
                  {(tech.specializations || []).map(s => (
                    <span key={s} style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 20, fontWeight: 600,
                      background: s === ticket?.category ? '#e8f0f9' : '#f3f4f6',
                      color:      s === ticket?.category ? 'var(--sliit-blue)' : 'var(--text-light)',
                      border:     s === ticket?.category ? '1px solid #bdd0ea' : '1px solid transparent',
                    }}>
                      {s.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                {/* Workload bar */}
                <WorkloadBar active={tech.activeTicketCount} />

                <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 5 }}>
                  ✓ {tech.completedTicketCount} completed
                  {tech.phone && <span style={{ marginLeft: 10 }}>📞 {tech.phone}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show all button */}
      {!showAll && technicians.length > 0 && (
        <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={loadAll}>
          Show All Technicians
        </button>
      )}

      {/* Assign confirm button — only shows when a technician is selected */}
      {selected && (
        <div style={{ marginTop: 10, padding: 12, background: '#f8f9fa', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 8 }}>
            Selected: <strong style={{ color: 'var(--sliit-blue)' }}>{selected.name}</strong>
            <span style={{ color: 'var(--text-light)' }}> — {selected.email}</span>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleAssign}
            disabled={assigning}
          >
            {assigning ? '⏳ Assigning...' : `✓ Assign to ${selected.name}`}
          </button>
        </div>
      )}
    </div>
  );
}
