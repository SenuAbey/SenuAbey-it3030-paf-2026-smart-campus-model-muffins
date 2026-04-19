import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CataloguePage from './pages/CataloguePage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import ResourceGroupPage from './pages/ResourceGroupPage';
import BookingsPage from './pages/bookings/BookingsPage';
import AdminBookingsPage from './pages/bookings/AdminBookingsPage';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import { useAuthStore } from './store/authStore';
import { getMe } from './api/authApi';
import './global.css';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketStatsPage from './pages/TicketStatsPage';
import TechniciansPage from './pages/TechniciansPage';

export const RoleContext = React.createContext('USER');

// ─── Protected Route ──────────────────────────────────────────────────────────
// - If no token → redirect to /login
// - If requiredRole is set and role doesn't match → redirect to /
function ProtectedRoute({ children, requiredRole }) {
  const { token } = useAuthStore();
  const { role } = useContext(RoleContext);

  if (!token) return <Navigate to="/login" />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" />;
  return children;
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const { token, setUser, role, setRole } = useAuthStore(); // role now comes from store (persisted)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getMe()
        .then(res => {
          setUser(res.data);
          setRole(res.data.role); // persists role to localStorage via store
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <BrowserRouter>
        <Routes>

          {/* ── Public routes ───────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* ── Shared protected routes (any logged-in user) ─────────── */}
          <Route path="/" element={
            <ProtectedRoute><CataloguePage /></ProtectedRoute>
          } />
          <Route path="/resources/:id" element={
            <ProtectedRoute><ResourceDetailPage /></ProtectedRoute>
          } />
          <Route path="/bookings" element={
            <ProtectedRoute><BookingsPage /></ProtectedRoute>
          } />
          <Route path="/tickets" element={
            <ProtectedRoute><TicketsPage /></ProtectedRoute>
          } />
          <Route path="/tickets/stats" element={
            <ProtectedRoute><TicketStatsPage /></ProtectedRoute>
          } />
          <Route path="/tickets/new" element={
            <ProtectedRoute><CreateTicketPage /></ProtectedRoute>
          } />
          <Route path="/tickets/:id" element={
            <ProtectedRoute><TicketDetailPage /></ProtectedRoute>
          } />

          {/* ── Admin-only protected routes ──────────────────────────── */}
          <Route path="/resource-groups" element={
            <ProtectedRoute requiredRole="ADMIN"><ResourceGroupPage /></ProtectedRoute>
          } />
          <Route path="/admin/bookings" element={
            <ProtectedRoute requiredRole="ADMIN"><AdminBookingsPage /></ProtectedRoute>
          } />
          <Route path="/technicians" element={
            <ProtectedRoute requiredRole="ADMIN"><TechniciansPage /></ProtectedRoute>
          } />

        </Routes>
      </BrowserRouter>
    </RoleContext.Provider>
  );
}

export default App;