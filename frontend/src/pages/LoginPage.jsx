import React from 'react';

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(rgba(0,51,102,0.92), rgba(0,83,160,0.92)), url("https://images.unsplash.com/photo-1541339907198-e08756ebafe3?w=1200&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
          <span style={{ color: '#003366' }}>UNI</span>{' '}
          <span style={{ color: '#E87722' }}>Campus Hub</span>
        </div>
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '32px' }}>
          Smart Campus Operations Hub
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', marginBottom: '8px' }}>
          Welcome Back
        </h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
          Sign in with your university Google account to continue
        </p>

        {/* Google Sign In Button */}
        <a href="http://localhost:8081/oauth2/authorization/google"
          style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%',
            padding: '14px 24px',
            background: '#fff',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 0.2s',
          }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#4285F4'}
            onMouseOut={e => e.currentTarget.style.borderColor = '#e0e0e0'}
          >
            {/* Google Icon */}
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Sign in with Google
          </button>
        </a>

        <p style={{ fontSize: '12px', color: '#aaa', marginTop: '24px' }}>
          Only university accounts are authorized to access this system
        </p>
      </div>
    </div>
  );
}