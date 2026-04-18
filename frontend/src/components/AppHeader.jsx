import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RoleContext } from '../App';
import { useAuthStore } from '../store/authStore';

export default function AppHeader({ extraNavButtons }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useContext(RoleContext);
  const { user, logoutUser } = useAuthStore();
  const isAdmin = role === 'ADMIN';

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navBtn = (path, filledBg) => {
    const active = isActive(path);
    const base = {
      padding: '0 18px',
      height: 48,
      fontSize: 13,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      border: 'none',
      cursor: 'pointer',
      borderRadius: 0,
      transition: 'background 0.15s, color 0.15s',
      display: 'flex',
      alignItems: 'center',
      gap: 5,
    };
    if (filledBg) {
      return {
        ...base,
        background: active ? filledBg : 'transparent',
        color: active ? '#fff' : filledBg,
        borderBottom: active ? `3px solid ${filledBg}` : '3px solid transparent',
      };
    }
    return {
      ...base,
      background: 'transparent',
      color: active ? '#fff' : 'rgba(255,255,255,0.78)',
      borderBottom: active ? '3px solid #F39200' : '3px solid transparent',
    };
  };

  return (
    <>
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e0e3e8',
        padding: '0 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 101,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}>

        {/* Logo */}
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#003366', letterSpacing: '-0.5px' }}>UNI</span>
          <span style={{ fontSize: 28, fontWeight: 300, color: '#F39200', marginLeft: 7, letterSpacing: '-0.5px' }}>Campus Hub</span>
        </div>

        {/* Right: user card + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* User card */}
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#f4f6fa',
              border: '1px solid #dde5f0',
              borderRadius: 10,
              padding: '5px 14px 5px 5px',
            }}>
              {/* Avatar */}
              {user.profilePicture
                ? <img
                    src={user.profilePicture}
                    alt={user.name || 'avatar'}
                    style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #0053A0', display: 'block', flexShrink: 0 }}
                  />
                : <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #0053A0, #003366)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17, fontWeight: 700, color: '#fff',
                  }}>
                    {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                  </div>
              }
              {/* Name + role */}
              <div style={{ lineHeight: 1.25 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#1a2b4a',
                  whiteSpace: 'nowrap', maxWidth: 200,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user.name || user.email}
                </div>
                <span style={{
                  display: 'inline-block', marginTop: 3,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  padding: '1px 7px', borderRadius: 3,
                  background: isAdmin ? '#F39200' : '#1D9E75',
                  color: '#fff',
                }}>
                  {role}
                </span>
              </div>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px',
              fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(192,57,43,0.35)',
              letterSpacing: '0.02em',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* ── Nav bar ───────────────────────────────────────────────── */}
      <nav style={{
        background: '#2d3748',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        height: 48,
        position: 'sticky',
        top: 64,
        zIndex: 100,
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      }}>
        <button style={navBtn('/', '#0053A0')} onClick={() => navigate('/')}>🏛 Catalogue</button>
        <button style={navBtn('/tickets', '#E87722')} onClick={() => navigate('/tickets')}>🔧 Tickets</button>

        {isAdmin && (
          <>
            <button style={navBtn('/admin/bookings')} onClick={() => navigate('/admin/bookings')}>📋 Bookings</button>
            <button style={navBtn('/technicians')} onClick={() => navigate('/technicians')}>👷 Technicians</button>
            <button style={navBtn('/resource-groups')} onClick={() => navigate('/resource-groups')}>🗂 Groups</button>
          </>
        )}

        {!isAdmin && (
          <button style={navBtn('/bookings')} onClick={() => navigate('/bookings')}>📅 My Bookings</button>
        )}

        {extraNavButtons}
      </nav>
    </>
  );
}
