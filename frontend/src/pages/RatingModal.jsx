import { useState } from 'react';
import { rateTechnician } from '../api/technicianApi';

function StarPicker({ value, onChange, label }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            style={{
              fontSize: 28, cursor: 'pointer',
              color: star <= (hovered || value) ? '#f59e0b' : '#d1d5db',
              transition: 'color 0.1s',
            }}
          >
            ★
          </span>
        ))}
        <span style={{ fontSize: 12, color: 'var(--text-light)', alignSelf: 'center', marginLeft: 4 }}>
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hovered || value] || ''}
        </span>
      </div>
    </div>
  );
}

export default function RatingModal({ ticket, onClose, onRated }) {
  const [qualityScore, setQualityScore] = useState(0);
  const [timeScore, setTimeScore]       = useState(0);
  const [feedback, setFeedback]         = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');

  const handleSubmit = async () => {
    if (!qualityScore || !timeScore) {
      setError('Please select both quality and time scores.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // We need technicianId — look up by email from the ticket's assignedTo
      // For now pass 0 if no technician system linked yet
      await rateTechnician({
        technicianId: ticket.technicianId || 1, // will be proper ID once assign panel used
        ticketId: ticket.id,
        qualityScore,
        timeScore,
        feedback: feedback.trim() || null,
        ratedBy: 'admin',
      });
      onRated && onRated();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <h3>⭐ Rate Technician</h3>
        <p style={{ marginBottom: 16 }}>
          How was the work done by <strong>{ticket.assignedTo}</strong> on ticket #{ticket.id}?
        </p>

        <StarPicker
          value={qualityScore}
          onChange={setQualityScore}
          label="Work Quality — how well was the issue resolved?"
        />
        <StarPicker
          value={timeScore}
          onChange={setTimeScore}
          label="Response Time — how quickly was it handled?"
        />

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            Feedback (optional)
          </div>
          <textarea
            placeholder="Any additional comments about the work done..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px', border: '1.5px solid var(--border)',
              borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
              resize: 'vertical', minHeight: 70, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>⚠ {error}</div>
        )}

        {/* Preview overall score */}
        {qualityScore > 0 && timeScore > 0 && (
          <div style={{
            padding: '8px 12px', background: '#e8f0f9', borderRadius: 8,
            fontSize: 13, marginBottom: 14, color: 'var(--sliit-blue)',
          }}>
            Overall score: <strong>{((qualityScore + timeScore) / 2).toFixed(1)} / 5.0</strong>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Skip
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !qualityScore || !timeScore}
          >
            {submitting ? '⏳ Submitting...' : '✓ Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}
