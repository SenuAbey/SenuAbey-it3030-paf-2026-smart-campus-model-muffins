import React, { useEffect, useState } from 'react';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      overflow: 'hidden',
    }}>

      {/* ── LEFT PANEL — Photo + Brand ─────────────────────────────── */}
      <div style={{
        flex: '0 0 58%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Full-bleed campus photo */}
        <img
          src="https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1400&q=85"
          alt="University Campus"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            transform: mounted ? 'scale(1)' : 'scale(1.06)',
            transition: 'transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />

        {/* Deep gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(170deg, rgba(0,20,60,0.35) 0%, rgba(0,30,80,0.55) 40%, rgba(0,20,60,0.92) 100%)',
        }} />

        {/* Subtle diagonal accent line */}
        <div style={{
          position: 'absolute',
          top: 0, left: '72%',
          width: '1px', height: '100%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(243,146,0,0.5) 40%, rgba(243,146,0,0.2) 70%, transparent 100%)',
        }} />

        {/* Content overlay */}
        <div style={{
          position: 'relative', zIndex: 2,
          height: '100%',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 52px',
        }}>
          {/* Top: Logo */}
          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-16px)',
            transition: 'all 0.7s ease 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 42, height: 42,
                background: '#F39200',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
                boxShadow: '0 4px 14px rgba(243,146,0,0.45)',
              }}>🏛</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                  UNI <span style={{ color: '#F39200' }}>Campus Hub</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 1 }}>
                  Smart Operations Platform
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Hero text */}
          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.8s ease 0.45s',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(243,146,0,0.18)',
              border: '1px solid rgba(243,146,0,0.4)',
              borderRadius: 20, padding: '5px 14px',
              marginBottom: 20,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F39200' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#F39200', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
                Campus Operations
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 3.2vw, 50px)',
              fontWeight: 300,
              color: '#fff',
              margin: '0 0 16px',
              lineHeight: 1.12,
              letterSpacing: '-0.5px',
            }}>
              Everything your<br />
              campus needs,<br />
              <em style={{ fontStyle: 'italic', fontWeight: 700, color: '#F39200' }}>in one place.</em>
            </h1>

            <p style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.62)',
              margin: '0 0 32px',
              lineHeight: 1.65,
              maxWidth: 360,
              fontFamily: 'sans-serif',
            }}>
              Manage facilities, raise maintenance tickets, book resources,
              and coordinate technicians — all from a single unified dashboard.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['🔧 Incident Tickets', '🏛 Asset Catalogue', '📅 Room Bookings', '👷 Technicians'].map((f, i) => (
                <div key={i} style={{
                  padding: '7px 14px',
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 20,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: 'sans-serif',
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                  transition: `all 0.5s ease ${0.6 + i * 0.08}s`,
                }}>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login Box ────────────────────────────────── */}
      <div style={{
        flex: '0 0 42%',
        background: '#f0f2f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateX(0)' : 'translateX(20px)',
        transition: 'all 0.7s ease 0.3s',
      }}>

        {/* ── The original white card, preserved exactly ── */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.13)',
        }}>
          {/* Logo */}
          <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', fontFamily: 'sans-serif' }}>
            <span style={{ color: '#003366' }}>UNI</span>{' '}
            <span style={{ color: '#E87722' }}>Campus Hub</span>
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '32px', fontFamily: 'sans-serif' }}>
            Smart Campus Operations Hub
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', marginBottom: '8px', fontFamily: 'sans-serif' }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px', fontFamily: 'sans-serif' }}>
            Sign in with your university Google account to continue
          </p>

          {/* Google Sign In Button */}
          <button
            onClick={() => { window.location.href = 'http://localhost:8081/oauth2/authorization/google'; }}
            style={{
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
              fontFamily: 'sans-serif',
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#4285F4'}
            onMouseOut={e => e.currentTarget.style.borderColor = '#e0e0e0'}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Sign in with Google
          </button>

          <p style={{ fontSize: '12px', color: '#aaa', marginTop: '24px', fontFamily: 'sans-serif' }}>
            Only university accounts are authorized to access this system
          </p>
        </div>

      </div>
    </div>
  );
}
