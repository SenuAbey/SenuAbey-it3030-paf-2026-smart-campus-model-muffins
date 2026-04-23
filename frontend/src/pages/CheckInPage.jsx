import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

//QR scan landing page - shows booking details and allows user to confirm check-in

//const API = "http://localhost:8081/api/v1";
const API = "http://192.168.1.245:8081/api/v1";

export default function CheckInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');

  // BUG FIX: start as false — we are NOT checking in yet, just loading details
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [message, setMessage] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [success, setSuccess] = useState(null); // null = not attempted yet
  const [error, setError] = useState('');
  const token = useAuthStore.getState().token;

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setLoadingDetails(false);
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(`${API}/bookings/${bookingId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setBookingDetails(response.data);

      // If already checked in, show that state immediately
      if (response.data.checkedIn) {
        setSuccess(true);
        setMessage('This booking has already been checked in.');
      }
    } catch (err) {
      setError('Could not load booking details. The booking may not exist or the QR code is invalid.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // BUG FIX: this is now only called when user clicks "Confirm Check-In"
  const performCheckIn = async () => {
    setCheckingIn(true);
    try {
      const response = await axios.post(
        `${API}/bookings/${bookingId}/checkin`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setSuccess(true);
      setMessage(response.data.message || 'Check-in successful!');
      // Refresh booking details to show updated state
      fetchBookingDetails();
    } catch (err) {
      setSuccess(false);
      setMessage(err.response?.data?.error || 'Check-in failed. Please contact staff.');
    } finally {
      setCheckingIn(false);
    }
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
  };

  const wrapStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  };

  // ── No bookingId in URL ──────────────────────────────────────────────────────
  if (!bookingId) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ margin: '0 0 8px' }}>Invalid QR Code</h2>
          <p style={{ color: '#666' }}>No booking ID found in this QR code.</p>
          <button onClick={() => navigate('/')} style={btnStyle('#667eea')}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Loading booking details ──────────────────────────────────────────────────
  if (loadingDetails) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2>Loading Booking Details...</h2>
          <p style={{ color: '#666' }}>Please wait...</p>
        </div>
      </div>
    );
  }

  // ── Failed to load booking ───────────────────────────────────────────────────
  if (error) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#E24B4A' }}>Booking Not Found</h2>
          <p style={{ color: '#666', marginTop: '8px' }}>{error}</p>
          <button onClick={() => navigate('/')} style={btnStyle('#667eea')}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Check-in result ──────────────────────────────────────────────────────────
  if (success === true) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#1D9E75', margin: '0 0 8px' }}>Check-in Successful!</h2>
          <p style={{ color: '#666' }}>{message}</p>
          <BookingInfoBox booking={bookingDetails} />
          <button onClick={() => navigate('/bookings')} style={btnStyle('#1D9E75')}>
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  if (success === false) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ color: '#E24B4A', margin: '0 0 8px' }}>Check-in Failed</h2>
          <p style={{ color: '#666' }}>{message}</p>
          <button onClick={() => navigate('/bookings')} style={btnStyle('#667eea')}>
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  // ── Main confirmation screen (shown after booking details load) ──────────────
  const isApproved = bookingDetails?.status === 'APPROVED';
  const alreadyCheckedIn = bookingDetails?.checkedIn;

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📱</div>
        <h2 style={{ margin: '0 0 4px', color: '#003366' }}>QR Check-In</h2>
        <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>
          Smart Campus Operations Hub
        </p>

        <BookingInfoBox booking={bookingDetails} />

        {!isApproved && (
          <div style={{
            marginTop: '16px', padding: '12px', borderRadius: '8px',
            background: '#FFF0F0', color: '#E24B4A', fontSize: '13px', fontWeight: '600'
          }}>
            ⚠️ This booking is <strong>{bookingDetails?.status}</strong> — only APPROVED bookings can check in.
          </div>
        )}

        {alreadyCheckedIn && (
          <div style={{
            marginTop: '16px', padding: '12px', borderRadius: '8px',
            background: '#E8F8F3', color: '#1D9E75', fontSize: '13px', fontWeight: '600'
          }}>
            ✅ Already checked in
          </div>
        )}

        {isApproved && !alreadyCheckedIn && (
          <button
            onClick={performCheckIn}
            disabled={checkingIn}
            style={btnStyle('#1D9E75', checkingIn)}
          >
            {checkingIn ? '⏳ Processing...' : '✅ Confirm Check-In'}
          </button>
        )}

        <button
          onClick={() => navigate('/bookings')}
          style={{ ...btnStyle('transparent'), color: '#667eea', border: '1px solid #667eea', marginTop: '10px' }}
        >
          Back to Bookings
        </button>
      </div>
    </div>
  );
}

function BookingInfoBox({ booking }) {
  if (!booking) return null;
  return (
    <div style={{
      margin: '16px 0', padding: '16px', background: '#f8f9fa',
      borderRadius: '10px', textAlign: 'left', fontSize: '14px', lineHeight: '1.8'
    }}>
      <p style={{ margin: 0 }}><strong>Resource:</strong> {booking.resourceName}</p>
      <p style={{ margin: 0 }}><strong>Booked by:</strong> {booking.bookedBy}</p>
      <p style={{ margin: 0 }}><strong>Date:</strong> {new Date(booking.startTime).toLocaleDateString()}</p>
      <p style={{ margin: 0 }}>
        <strong>Time:</strong> {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {' – '}
        {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
      {booking.purpose && <p style={{ margin: 0 }}><strong>Purpose:</strong> {booking.purpose}</p>}
    </div>
  );
}

function btnStyle(bg, disabled = false) {
  return {
    display: 'block',
    width: '100%',
    marginTop: '16px',
    padding: '12px 24px',
    background: bg,
    color: bg === 'transparent' ? '#667eea' : 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    opacity: disabled ? 0.6 : 1,
    transition: 'opacity 0.2s'
  };
}
