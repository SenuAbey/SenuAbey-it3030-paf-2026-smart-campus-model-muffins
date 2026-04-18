import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createTicket } from '../api/ticketApi';
import { getResources } from '../api/resourceApi';
import { useAuthStore } from '../store/authStore';
import AppHeader from '../components/AppHeader';
import './tickets.css';

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

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledResourceId = searchParams.get('resourceId');

  const { user } = useAuthStore();

  const [resources, setResources]     = useState([]);
  const [loadingRes, setLoadingRes]   = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState({});
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    resourceId: prefilledResourceId || '',
    resourceName: '',
  });

  // Load ACTIVE resources from the catalogue API
  useEffect(() => {
    const loadResources = async () => {
      setLoadingRes(true);
      try {
        const res = await getResources({ size: 200, status: 'ACTIVE' });
        const content = res.data?.content || res.data || [];
        const list = Array.isArray(content) ? content : [];
        setResources(list);

        if (prefilledResourceId) {
          const found = list.find(r => String(r.id) === String(prefilledResourceId));
          if (found) {
            setForm(prev => ({ ...prev, resourceId: String(found.id), resourceName: found.name }));
          }
        }
      } catch (e) {
        console.warn('Could not load resources:', e.message);
      } finally {
        setLoadingRes(false);
      }
    };
    loadResources();
  }, [prefilledResourceId]);

  const handleResourceChange = (e) => {
    const id = e.target.value;
    const resource = resources.find(r => String(r.id) === id);
    setForm(prev => ({ ...prev, resourceId: id, resourceName: resource?.name || '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim())                errs.title       = 'Title is required';
    else if (form.title.length < 5)        errs.title       = 'Title must be at least 5 characters';
    if (!form.description.trim())          errs.description = 'Description is required';
    else if (form.description.length < 10) errs.description = 'Please describe the issue in more detail';
    if (!form.category)                    errs.category    = 'Category is required';
    if (!form.priority)                    errs.priority    = 'Priority is required';
    if (!form.resourceId)                  errs.resourceId  = 'You must select a resource';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const selectedResource = resources.find(r => String(r.id) === String(form.resourceId));
      const payload = {
        title:           form.title.trim(),
        description:     form.description.trim(),
        category:        form.category,
        priority:        form.priority,
        reportedBy:      user?.email || user?.name || 'unknown',
        preferredContact: user?.email || null,
        location:        selectedResource?.location || selectedResource?.building || null,
        resourceName:    form.resourceName || null,
        resourceId:      parseInt(form.resourceId),
      };

      const created = await createTicket(payload);
      navigate(`/tickets/${created.id}`, {
        state: { success: 'Your ticket has been submitted successfully!' },
      });
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error;
      setSubmitError(msg || `Error ${e.response?.status || ''}: Failed to submit ticket.`);
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const selectedResource = resources.find(r => String(r.id) === String(form.resourceId));

  return (
    <div className="tickets-page">
      {/* Header */}
      <AppHeader />

      <div className="app-banner" style={{
        backgroundImage: "linear-gradient(rgba(0,51,102,0.88), rgba(0,83,160,0.88)), url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80')",
      }}>
        <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Smart Campus Operations Hub
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '300', margin: '0 0 8px', color: '#fff' }}>
          Report an <strong style={{ fontWeight: '800' }}>Incident</strong>
        </h1>
        <p style={{ opacity: 0.8, margin: 0, fontSize: '15px', color: '#fff' }}>
          Submit a maintenance or facility issue — our team will respond promptly
        </p>
      </div>

      {/* Submitting as logged-in user */}
      <div style={{ padding: '0 5%', marginTop: '1rem' }}>
        <div className="role-banner user">
          👤 Submitting as <strong>{user?.name || user?.email || 'Unknown User'}</strong>
          {user?.email && user?.name && (
            <span style={{ opacity: 0.8, marginLeft: 6 }}>({user.email})</span>
          )}
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

            {/* ── Incident Details ── */}
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

            {/* ── Linked Resource (compulsory) ── */}
            <p className="form-section-title">🖥️ Linked Resource <span className="required">*</span></p>

            <div className="form-group">
              <label>Select Resource <span className="required">*</span></label>
              <select
                value={form.resourceId}
                onChange={handleResourceChange}
                disabled={loadingRes}
              >
                <option value="">
                  {loadingRes ? 'Loading resources...' : '— Select a resource —'}
                </option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>
                    [{r.type?.replace(/_/g, ' ')}] {r.name}
                    {r.location ? ` — ${r.location}` : ''}
                    {r.building ? ` (${r.building})` : ''}
                  </option>
                ))}
              </select>
              {errors.resourceId && <span className="form-error">⚠ {errors.resourceId}</span>}
              {!loadingRes && resources.length > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                  {resources.length} active resources available from the catalogue
                </span>
              )}
            </div>

            {/* Show resource details once selected */}
            {selectedResource && (
              <div style={{
                padding: '10px 14px', background: '#e8f0f9', borderRadius: 'var(--radius-sm)',
                fontSize: '13px', color: 'var(--sliit-blue)', marginBottom: '14px',
                border: '1px solid #bdd0ea', display: 'flex', gap: '16px', flexWrap: 'wrap',
              }}>
                <span>🏷️ <strong>{selectedResource.name}</strong></span>
                <span>📂 {selectedResource.type?.replace(/_/g, ' ')}</span>
                {selectedResource.location && <span>📍 {selectedResource.location}</span>}
                {selectedResource.building && <span>🏢 {selectedResource.building}</span>}
                <span style={{
                  color: selectedResource.status === 'ACTIVE' ? '#1D9E75' : '#E24B4A',
                  fontWeight: 600,
                }}>
                  ● {selectedResource.status}
                </span>
              </div>
            )}
          </div>

          <div className="form-footer">
            <button className="btn btn-ghost" onClick={() => navigate('/tickets')} disabled={submitting}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || loadingRes}>
              {submitting ? '⏳ Submitting...' : '✓ Submit Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
