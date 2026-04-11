import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createTicket } from '../api/ticketApi';
import './tickets.css';

const CATEGORIES = [
  'ELECTRICAL', 'PLUMBING', 'HVAC', 'IT_EQUIPMENT',
  'FURNITURE', 'SAFETY', 'CLEANING', 'OTHER',
];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const priorityInfo = {
  LOW: { icon: '▼', desc: 'Non-urgent, can wait for scheduled maintenance' },
  MEDIUM: { icon: '●', desc: 'Should be addressed within a few days' },
  HIGH: { icon: '▲', desc: 'Affecting operations, needs prompt attention' },
  CRITICAL: { icon: '🔥', desc: 'Immediate safety or operational risk' },
};

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledResourceId = searchParams.get('resourceId');

  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    resourceId: prefilledResourceId || '',
    resourceName: '',
    location: '',
    reportedBy: '',
    preferredContact: '',
  });

  // Load resources from Module A for the dropdown
  useEffect(() => {
    const loadResources = async () => {
      setLoadingResources(true);
      try {
        const { default: axios } = await import('axios');
        const res = await axios.get('http://localhost:8081/api/v1/resources', {
          params: { size: 100, status: 'ACTIVE' },
        });
        const content = res.data?.content || res.data || [];
        setResources(Array.isArray(content) ? content : []);

        // Auto-fill resource details if pre-filled
        if (prefilledResourceId) {
          const found = content.find(r => String(r.id) === String(prefilledResourceId));
          if (found) {
            setForm(prev => ({
              ...prev,
              resourceId: found.id,
              resourceName: found.name,
              location: found.location || '',
            }));
          }
        }
      } catch (e) {
        console.warn('Could not load resources from Module A:', e.message);
      } finally {
        setLoadingResources(false);
      }
    };
    loadResources();
  }, [prefilledResourceId]);

  const handleResourceChange = (e) => {
    const id = e.target.value;
    const resource = resources.find(r => String(r.id) === id);
    setForm(prev => ({
      ...prev,
      resourceId: id,
      resourceName: resource?.name || '',
      location: resource?.location || prev.location,
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    else if (form.title.length < 5) errs.title = 'Title must be at least 5 characters';
    if (!form.description.trim()) errs.description = 'Description is required';
    else if (form.description.length < 10) errs.description = 'Please describe the issue in more detail (min 10 chars)';
    if (!form.category) errs.category = 'Category is required';
    if (!form.priority) errs.priority = 'Priority is required';
    if (!form.reportedBy.trim()) errs.reportedBy = 'Your name or email is required';
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
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        reportedBy: form.reportedBy.trim(),
        preferredContact: form.preferredContact.trim() || null,
        location: form.location.trim() || null,
        resourceName: form.resourceName || null,
      };

      if (form.resourceId) {
        payload.resourceId = parseInt(form.resourceId);
      }

      const created = await createTicket(payload);
      navigate(`/tickets/${created.id}`, {
        state: { success: 'Ticket created successfully!' },
      });
    } catch (e) {
      setSubmitError(
        e.response?.data?.message ||
        'Failed to create ticket. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key, value) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="tickets-page">
      <div className="page-header">
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}
          onClick={() => navigate('/tickets')}
        >
          ← Back to Tickets
        </button>
        <h1>Report an Incident</h1>
        <p>Submit a maintenance or facility issue for the campus operations team</p>
      </div>

      <div className="page-content">
        <div className="form-card">
          <div className="form-card-header">
            <h2>🔧 New Incident Ticket</h2>
            <p>Fields marked <span style={{ color: '#fbbf24' }}>*</span> are required</p>
          </div>

          <div className="form-body">
            {submitError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
                padding: '0.85rem 1rem', borderRadius: '9px', marginBottom: '1rem',
                fontSize: '0.875rem',
              }}>
                ⚠️ {submitError}
              </div>
            )}

            {/* ─── Incident Details ─────────────────────────────────── */}
            <p className="form-section-title">Incident Details</p>

            <div className="form-group">
              <label>Title <span className="required">*</span></label>
              <input
                type="text"
                placeholder="e.g., Projector not working in Lab A-201"
                value={form.title}
                onChange={e => field('title', e.target.value)}
                maxLength={255}
              />
              {errors.title && <span className="form-error">⚠ {errors.title}</span>}
            </div>

            <div className="form-group">
              <label>Description <span className="required">*</span></label>
              <textarea
                placeholder="Describe the issue in detail. Include when it started, how it's affecting operations, and any steps already taken..."
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
                    <option key={p} value={p}>
                      {priorityInfo[p].icon} {p}
                    </option>
                  ))}
                </select>
                {form.priority && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                    {priorityInfo[form.priority].desc}
                  </span>
                )}
              </div>
            </div>

            {/* ─── Location ─────────────────────────────────────────── */}
            <p className="form-section-title">Location & Resource</p>

            <div className="form-group">
              <label>Linked Resource</label>
              <select
                value={form.resourceId}
                onChange={handleResourceChange}
                disabled={loadingResources}
              >
                <option value="">
                  {loadingResources ? 'Loading resources...' : 'Select a resource (optional)'}
                </option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.type?.replace(/_/g, ' ')} ({r.location || 'No location'})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                Linking a resource helps track which facilities need attention
              </span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location / Room</label>
                <input
                  type="text"
                  placeholder="e.g., Block A, Floor 2, Room 201"
                  value={form.location}
                  onChange={e => field('location', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Resource Name</label>
                <input
                  type="text"
                  placeholder="Auto-filled from dropdown above"
                  value={form.resourceName}
                  onChange={e => field('resourceName', e.target.value)}
                />
              </div>
            </div>

            {/* ─── Reporter ─────────────────────────────────────────── */}
            <p className="form-section-title">Reporter Information</p>

            <div className="form-row">
              <div className="form-group">
                <label>Your Name / Email <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., senuthi@sliit.lk"
                  value={form.reportedBy}
                  onChange={e => field('reportedBy', e.target.value)}
                />
                {errors.reportedBy && <span className="form-error">⚠ {errors.reportedBy}</span>}
              </div>

              <div className="form-group">
                <label>Preferred Contact</label>
                <input
                  type="text"
                  placeholder="Phone number or best contact method"
                  value={form.preferredContact}
                  onChange={e => field('preferredContact', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/tickets')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '⏳ Submitting...' : '✓ Submit Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
