import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
//QR Code Popup page
//const API = "http://localhost:8081/api/v1";
const API = "http://192.168.1.245:8081/api/v1";

export default function QRCodeModal({ booking, onClose }) {
  const [qrImage, setQrImage] = useState(null);    //Stores the QR image URL
  const [loading, setLoading] = useState(false);
  const token = useAuthStore.getState().token;

  const generateQR = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/bookings/${booking.id}/qr-code`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const imageUrl = URL.createObjectURL(response.data);
      setQrImage(imageUrl);
    } catch (err) {
      alert('Failed to generate QR code. Only approved bookings can generate QR codes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, textAlign: 'center' }}>
        <h3>📱 Check-in QR Code</h3>
        <p style={{ color: '#666', marginBottom: 20 }}>
          Booking: <strong>{booking.resourceName}</strong><br />
          Date: {new Date(booking.startTime).toLocaleDateString()}<br />
          Time: {new Date(booking.startTime).toLocaleTimeString()} - {new Date(booking.endTime).toLocaleTimeString()}
        </p>

        {!qrImage && !loading && (
          <button 
            onClick={generateQR}
            style={{
              padding: '12px 24px',
              background: '#1D9E75',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 16,
              marginBottom: 20
            }}
          >
            Generate QR Code
          </button>
        )}

        {loading && <p>Generating QR Code...</p>}

        {qrImage && (
          <div>
            <img src={qrImage} alt="QR Code" style={{ width: 250, height: 250, margin: '10px 0' }} />
            <p style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
              Show this QR code at the facility for check-in
            </p>
            <button
              onClick={() => window.print()}
              style={{
                marginTop: 10,
                padding: '8px 16px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer'
              }}
            >
              🖨️ Print QR Code
            </button>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}