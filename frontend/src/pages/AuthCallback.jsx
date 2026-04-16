import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/authApi';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      setToken(token);
      getMe()
        .then(res => {
          setUser(res.data);
          navigate('/');
        })
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      background: '#f5f6fa'
    }}>
      <div style={{ fontSize: '32px' }}>⏳</div>
      <p style={{ color: '#666', fontSize: '16px' }}>Signing you in...</p>
    </div>
  );
}