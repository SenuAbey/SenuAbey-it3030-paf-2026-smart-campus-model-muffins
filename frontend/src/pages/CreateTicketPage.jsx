import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createTicket } from '../api/ticketApi';
import './tickets.css';

// ─── Campus Location Data ─────────────────────────────────────────────────────

const BUILDINGS = [
  { id: 'A', label: 'A Block' },
  { id: 'B', label: 'B Block' },
  { id: 'C', label: 'C Block' },
  { id: 'D', label: 'D Block' },
  { id: 'E', label: 'E Block' },
  { id: 'F', label: 'F Block (New Building)' },
  { id: 'G', label: 'G Block (New Building)' },
  { id: 'MAIN', label: 'Main Building' },
  { id: 'BS', label: 'Business School' },
  { id: 'ENG', label: 'Engineering Faculty Building' },
  { id: 'GYM', label: 'Gymnasium' },
  { id: 'OTHER', label: 'Other / Common Area' },
];

// Blocks that have standard floor+room numbering (A-F blocks)
const STANDARD_BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const FLOORS = [1, 2, 3, 4, 5, 6];
const ROOMS_PER_FLOOR = [1, 2, 3, 4, 5, 6];

// Generate lab options for a given block and floor
// e.g. Block A, Floor 4 → A401, A402, A403, A404, A405, A406
const generateLabOptions = (block, floor) => {
  if (!block || !floor) return [];
  return ROOMS_PER_FLOOR.map(room => {
    const roomNum = `${block}${floor}0${room}`;
    return { value: roomNum, label: `Lab / Room ${roomNum}` };
  });
};

const CATEGORIES = [
  'ELECTRICAL', 'PLUMBING', 'HVAC', 'IT_EQUIPMENT',
  'FURNITURE', 'SAFETY', 'CLEANING', 'OTHER',
];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const priorityInfo = {
  LOW:      'Non-urgent, can wait for scheduled maintenance',
  MEDIUM:   'Should be addressed within a few days',
  HIGH:     'Affecting operations, needs prompt attention',
  CRITICAL: 'Immediate safety or operational risk — urgent!',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledResourceId = searchParams.get('resourceId');

  const [resources, setResources]           = useState([]);
  const [submitting, setSubmitting]         = useState(false);
  const [errors, setErrors]                 = useState({});
  const [submitError, setSubmitError]       = useState('');

  // Location state
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor]       = useState('');
  const [selectedRoom, setSelectedRoom]         = useState('');
  const [customLocation, setCustomLocation]     = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    resourceId: prefilledResourceId || '',
    resourceName: '',
    reportedBy: '',
    preferredContact: '',
  });

  // Load resources from Module A
  useEffect(() => {
    const loadResources = async () => {
      try {
        const { default: axios } = await import('axios');
        const res = await axios.get('http://localhost:8081/api/v1/resources', {
          params: { size: 100 },
        });
        const content = res.data?.content || res.data || [];
        setResources(Array.isArray(content) ? content : []);

        if (prefilledResourceId) {
          const found = content.find(r => String(r.id) === String(prefilledResourceId));
          if (found) {
            setForm(prev => ({ ...prev, resourceId: found.id, resourceName: found.name }));
          }
        }
      } catch (e) {
        console.warn('Could not load resources:', e.message);
      }
    };
    loadResources();
  }, [prefilledResourceId]);

  // Compute the final location string from selections
  const computedLocation = () => {
    if (!selectedBuilding) return customLocation;
    const bLabel = BUILDINGS.find(b => b.id === selectedBuilding)?.label || selectedBuilding;
    if (!STANDARD_BLOCKS.includes(selectedBuilding)) {
      return selectedRoom
        ? `${bLabel} — ${selectedRoom}`
        : bLabel;
    }
    if (!selectedFloor) return bLabel;
    if (!selectedRoom)  return `${bLabel}, Floor ${selectedFloor}`;
    return `${bLabel}, Floor ${selectedFloor}, Room ${selectedRoom}`;
  };

  const handleBuildingChange = (val) => {
    setSelectedBuilding(val);
    setSelectedFloor('');
    setSelectedRoom('');
  };

  const handleResourceChange = (e) => {
    const id = e.target.value;
    const resource = resources.find(r => String(r.id) === id);
    setForm(prev => ({ ...prev, resourceId: id, resourceName: resource?.name || '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim())        errs.title       = 'Title is required';
    else if (form.title.length < 5) errs.title      = 'Title must be at least 5 characters';
    if (!form.description.trim())  errs.description  = 'Description is required';
    else if (form.description.length < 10) errs.description = 'Please describe the issue in more detail';
    if (!form.category)            errs.category     = 'Category is required';
    if (!form.priority)            errs.priority     = 'Priority is required';
    if (!form.reportedBy.trim())   errs.reportedBy   = 'Your name or email is required';
    if (!selectedBuilding && !customLocation.trim()) errs.location = 'Location is required';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        title:            form.title.trim(),
        description:      form.description.trim(),
        category:         form.category,
        priority:         form.priority,
        reportedBy:       form.reportedBy.trim(),
        preferredContact: form.preferredContact.trim() || null,
        location:         computedLocation() || null,
        resourceName:     form.resourceName || null,
        resourceId:       form.resourceId ? parseInt(form.resourceId) : null,
      };

      const created = await createTicket(payload);
      navigate(`/tickets/${created.id}`, {
        state: { success: 'Your ticket has been submitted successfully!' },
      });
    } catch (e) {
      setSubmitError(
        e.response?.data?.message ||
        'Failed to submit ticket. Please make sure the backend is running.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const isStandardBlock = STANDARD_BLOCKS.includes(selectedBuilding);
  const labOptions = generateLabOptions(selectedBuilding, selectedFloor);

  return (
    <div className="tickets-page">
      {/* Header */}
      <div className="page-header">
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}
          onClick={() => navigate('/tickets')}
        >
          ← Back to Tickets
        </button>
        <h1>🔧 Report an Incident</h1>
        <p>Submit a maintenance or facility issue — our team will respond promptly</p>
      </div>

      {/* User role notice */}
      <div style={{ padding: '0 5%', marginTop: '1rem' }}>
        <div className="role-banner user">
          👤 You are submitting as a <strong>User</strong> — your ticket will be reviewed by an admin
        </div>
      </div>

      <div className="page-content">
        <div className="form-card">
          <div className="form-card-header">
            <h2>New Incident Ticket</h2>
            <p>Fields marked <span style={{ color: '#fcd34d' }}>*</span> are required</p>
          </div>

          <div className="form-body">
            {submitError && (
              <div className="toast-error">⚠️ {submitError}</div>
            )}

            {/* ── Incident Details ───────────────────────── */}
            <p className="form-section-title">📋 Incident Details</p>

            <div className="form-group">
              <label>Title <span className="required">*</span></label>
              <input
                type="text"
                placeholder="e.g. Projector not working in Lab A402"
                value={form.title}
                onChange={e => field('title', e.target.value)}
                maxLength={255}
              />
              {errors.title && <span className="form-error">⚠ {errors.title}</span>}
            </div>

            <div className="form-group">
              <label>Description <span className="required">*</span></label>
              <textarea
                placeholder="Describe the issue in detail — when did it start, how is it affecting operations, any steps already taken..."
                value={form.description}
                onChange={e => field('description', e.target.value)}
                rows={4}
              />
              {errors.description && <span className="form-error">⚠ {errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category <span className="required">*</span></label>
                <select value={form.category} onChange={e => field('category', e.target.value)}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                {errors.category && <span className="form-error">⚠ {errors.category}</span>}
              </div>

              <div className="form-group">
                <label>Priority <span className="required">*</span></label>
                <select value={form.priority} onChange={e => field('priority', e.target.value)}>
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {form.priority && (
                  <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                    {priorityInfo[form.priority]}
                  </span>
                )}
              </div>
            </div>

            {/* ── Location ───────────────────────────────── */}
            <p className="form-section-title">📍 Location</p>

            <div className="form-group">
              <label>Building / Area <span className="required">*</span></label>
              <select value={selectedBuilding} onChange={e => handleBuildingChange(e.target.value)}>
                <option value="">Select building...</option>
                {BUILDINGS.map(b => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
              {errors.location && !selectedBuilding && (
                <span className="form-error">⚠ {errors.location}</span>
              )}
            </div>

            {/* Floor selection — only for standard A-G blocks */}
            {isStandardBlock && selectedBuilding && (
              <div className="form-row">
                <div className="form-group">
                  <label>Floor</label>
                  <select value={selectedFloor} onChange={e => { setSelectedFloor(e.target.value); setSelectedRoom(''); }}>
                    <option value="">Select floor...</option>
                    {FLOORS.map(f => (
                      <option key={f} value={f}>Floor {f}</option>
                    ))}
                  </select>
                </div>

                {/* Room/Lab — only after floor selected */}
                {selectedFloor && (
                  <div className="form-group">
                    <label>Lab / Room</label>
                    <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
                      <option value="">Select lab/room...</option>
                      {labOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* For non-standard buildings, show a free text field */}
            {selectedBuilding && !isStandardBlock && (
              <div className="form-group">
                <label>Specific Location / Room</label>
                <input
                  type="text"
                  placeholder="e.g. Main Hall, Ground Floor Reception, Pool Area..."
                  value={customLocation}
                  onChange={e => setCustomLocation(e.target.value)}
                />
              </div>
            )}

            {/* Show selected location preview */}
            {computedLocation() && (
              <div style={{
                padding: '8px 12px', background: '#e8f0f9', borderRadius: 'var(--radius-sm)',
                fontSize: '13px', color: 'var(--sliit-blue)', marginBottom: '14px',
                border: '1px solid #bdd0ea',
              }}>
                📍 Selected: <strong>{computedLocation()}</strong>
              </div>
            )}

            {/* ── Resource ───────────────────────────────── */}
            <p className="form-section-title">🖥️ Linked Resource (Optional)</p>

            <div className="form-group">
              <label>Resource</label>
              <select value={form.resourceId} onChange={handleResourceChange}>
                <option value="">No specific resource / General area issue</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.type?.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                Link to a specific resource if the issue is related to equipment
              </span>
            </div>

            {/* ── Reporter Info ──────────────────────────── */}
            <p className="form-section-title">👤 Your Information</p>

            <div className="form-row">
              <div className="form-group">
                <label>Your Name / Email <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. senuthi@sliit.lk"
                  value={form.reportedBy}
                  onChange={e => field('reportedBy', e.target.value)}
                />
                {errors.reportedBy && <span className="form-error">⚠ {errors.reportedBy}</span>}
              </div>

              <div className="form-group">
                <label>Preferred Contact</label>
                <input
                  type="text"
                  placeholder="Phone number or alternate contact"
                  value={form.preferredContact}
                  onChange={e => field('preferredContact', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button className="btn btn-ghost" onClick={() => navigate('/tickets')} disabled={submitting}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '⏳ Submitting...' : '✓ Submit Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
