import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { RoleContext } from "../../App";
import { useAuthStore } from "../../store/authStore";
import NotificationBell from '../../components/NotificationBell';

const API = "http://localhost:8081/api/v1";

function authConfig() {
  const token = useAuthStore.getState().token;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

const STATUS_META = {
  PENDING:   { color: "#BA7517", bg: "#FFF8EC", label: "Pending",   icon: "⏳" },
  APPROVED:  { color: "#1D9E75", bg: "#E8F8F3", label: "Approved",  icon: "✅" },
  REJECTED:  { color: "#E24B4A", bg: "#FFF0F0", label: "Rejected",  icon: "❌" },
  CANCELLED: { color: "#888780", bg: "#F5F5F5", label: "Cancelled", icon: "🚫" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.PENDING;
  return (
    <span style={{
      fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px",
      background: m.bg, color: m.color, display: "inline-flex", alignItems: "center", gap: "4px"
    }}>{m.icon} {m.label}</span>
  );
}

export default function AdminBookingsPage() {
  const navigate = useNavigate();
  const { role } = useContext(RoleContext);
  const { user, logoutUser } = useAuthStore();
  const isAdmin = role === "ADMIN";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    // Redirect non-admins away
    if (!isAdmin) { navigate("/bookings"); return; }
    fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/bookings`, authConfig());
      setBookings(res.data);
    } catch {
      toast.error("Failed to load bookings");
    } finally { setLoading(false); }
  };

  const approve = async (id) => {
    setProcessingId(id);
    try {
      await axios.patch(`${API}/bookings/${id}/approve`, {}, authConfig());
      toast.success("Booking approved!");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve");
    } finally { setProcessingId(null); }
  };

  const reject = async () => {
    if (!rejectReason.trim()) { toast.error("Please provide a rejection reason"); return; }
    setProcessingId(rejectModal);
    try {
      await axios.patch(`${API}/bookings/${rejectModal}/reject`, { reason: rejectReason }, authConfig());
      toast.success("Booking rejected");
      setRejectModal(null);
      setRejectReason("");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
    } finally { setProcessingId(null); }
  };

  const counts = Object.fromEntries(Object.keys(STATUS_META).map(s => [s, bookings.filter(b => b.status === s).length]));

  const filtered = bookings.filter(b => {
    const matchStatus = !filterStatus || b.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || b.resourceName?.toLowerCase().includes(q) || b.bookedBy?.toLowerCase().includes(q) || b.purpose?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pendingCount = counts["PENDING"] || 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "inherit" }}>
      <Toaster position="top-right" />

      <header className="app-header">
        <div className="app-logo" onClick={() => navigate("/")} style={{ flexShrink: 0 }}>
          UNI <span>Campus Hub</span>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

          {/* User Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {user?.profilePicture && (
              <img src={user.profilePicture} alt="profile"
                style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid #E87722" }} />
            )}
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>
              {user?.name}
            </span>
            <span style={{
              fontSize: "11px", padding: "2px 10px", borderRadius: "12px", fontWeight: "700",
              background: isAdmin ? "#003366" : "#E87722", color: "#fff"
            }}>
              {role}
            </span>
            <NotificationBell />
            <button className="btn btn-secondary" style={{ fontSize: "12px", padding: "6px 12px" }}
              onClick={() => { logoutUser(); window.location.href = "/login"; }}>
              Logout
            </button>
          </div>

          <button className="btn btn-secondary" onClick={() => navigate("/tickets")}>
            🔧 Incident Tickets
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/technicians")}>
            👷 Manage Technicians
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/admin/bookings")}>
            📋 Manage Bookings
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/resource-groups")}>
            🗂️ Manage Groups
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/")}>
            ← Catalogue
          </button>
        </div>
      </header>

      <div className="app-banner" style={{
        backgroundImage: "linear-gradient(rgba(0,51,102,0.92), rgba(0,51,102,0.75)), url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80')"
      }}>
        <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Admin Panel</div>
        <h1 style={{ fontSize: "36px", fontWeight: "300", margin: "0 0 8px", color: "#fff" }}>
          Booking <strong style={{ fontWeight: "800" }}>Administration</strong>
        </h1>
        <p style={{ opacity: 0.8, margin: 0, fontSize: "15px", color: "#fff" }}>
          Review, approve, and manage all campus booking requests
          {pendingCount > 0 && (
            <span style={{ marginLeft: "12px", background: "#F39200", color: "#fff", padding: "2px 10px", borderRadius: "20px", fontSize: "13px", fontWeight: "700" }}>
              {pendingCount} pending
            </span>
          )}
        </p>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "30px 20px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
          {Object.entries(STATUS_META).map(([status, meta]) => (
            <div key={status} style={{
              background: "#fff", borderRadius: "10px", padding: "16px 20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: `4px solid ${meta.color}`,
              cursor: "pointer", transition: "transform 0.15s",
              outline: filterStatus === status ? `2px solid ${meta.color}` : "none",
            }}
              onClick={() => setFilterStatus(filterStatus === status ? "" : status)}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = ""}
            >
              <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{meta.icon} {meta.label}</div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: meta.color }}>{counts[status] || 0}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="Search resource, user, purpose..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ flex: 1, minWidth: "200px", maxWidth: "380px", padding: "9px 14px" }}
          />
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button onClick={() => setFilterStatus("")} style={{
              padding: "7px 16px", borderRadius: "20px",
              border: `1px solid ${!filterStatus ? "var(--sliit-blue)" : "#ddd"}`,
              background: !filterStatus ? "var(--sliit-blue)" : "transparent",
              color: !filterStatus ? "#fff" : "#666", cursor: "pointer", fontSize: "12px", fontWeight: "600"
            }}>All ({bookings.length})</button>
            {Object.entries(STATUS_META).map(([status, meta]) => (
              <button key={status} onClick={() => setFilterStatus(filterStatus === status ? "" : status)} style={{
                padding: "7px 16px", borderRadius: "20px",
                border: `1px solid ${filterStatus === status ? meta.color : "#ddd"}`,
                background: filterStatus === status ? meta.bg : "transparent",
                color: filterStatus === status ? meta.color : "#666",
                cursor: "pointer", fontSize: "12px", fontWeight: "600"
              }}>{meta.icon} {meta.label} ({counts[status] || 0})</button>
            ))}
          </div>
          <button onClick={fetchAll} style={{
            marginLeft: "auto", padding: "7px 14px", borderRadius: "20px",
            border: "1px solid #ddd", background: "transparent", cursor: "pointer", fontSize: "12px", color: "#666"
          }}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#aaa" }}>Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", background: "#fff", borderRadius: "12px", border: "1px dashed #ddd", color: "#aaa" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
            <div style={{ fontSize: "15px", fontWeight: "600" }}>No bookings found</div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #eee", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.5fr 1.8fr 1.8fr 80px 80px 160px",
              padding: "12px 20px", background: "#f7f9fb",
              borderBottom: "1px solid #eee", fontSize: "11px", fontWeight: "700",
              color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em"
            }}>
              <span>Resource</span><span>Booked By</span><span>Start Time</span>
              <span>End Time</span><span>Pax</span><span>Status</span><span>Actions</span>
            </div>

            {filtered.map((b, i) => {
              const start = new Date(b.startTime);
              const end = new Date(b.endTime);
              const isProcessing = processingId === b.id;
              return (
                <div key={b.id} style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1.8fr 1.8fr 80px 80px 160px",
                  padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #f5f5f5" : "none",
                  alignItems: "center", background: b.status === "PENDING" ? "#FFFDF5" : "#fff",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafcff"}
                  onMouseLeave={e => e.currentTarget.style.background = b.status === "PENDING" ? "#FFFDF5" : "#fff"}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#003366" }}>{b.resourceName}</div>
                    {b.purpose && <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>🎯 {b.purpose}</div>}
                  </div>
                  <div style={{ fontSize: "13px", color: "#555" }}>{b.bookedBy}</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "500" }}>{start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                    <div style={{ fontSize: "12px", color: "#888" }}>{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "500" }}>{end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                    <div style={{ fontSize: "12px", color: "#888" }}>{end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <div style={{ fontSize: "13px", color: "#555" }}>{b.attendees || "—"}</div>
                  <div><StatusBadge status={b.status} /></div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {b.status === "PENDING" && (
                      <>
                        <button onClick={() => approve(b.id)} disabled={isProcessing} style={{
                          padding: "6px 12px", borderRadius: "7px", border: "none",
                          background: "#1D9E75", color: "#fff", cursor: "pointer",
                          fontSize: "12px", fontWeight: "600", opacity: isProcessing ? 0.5 : 1
                        }}>✓ Approve</button>
                        <button onClick={() => { setRejectModal(b.id); setRejectReason(""); }} disabled={isProcessing} style={{
                          padding: "6px 12px", borderRadius: "7px",
                          border: "1px solid #ffcdd2", background: "transparent",
                          color: "#e53935", cursor: "pointer", fontSize: "12px", fontWeight: "600",
                          opacity: isProcessing ? 0.5 : 1
                        }}>✕ Reject</button>
                      </>
                    )}
                    {b.status === "REJECTED" && b.rejectionReason && (
                      <span style={{ fontSize: "11px", color: "#e53935", fontStyle: "italic" }} title={b.rejectionReason}>
                        {b.rejectionReason.length > 20 ? b.rejectionReason.slice(0, 20) + "…" : b.rejectionReason}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="app-footer">
        © 2026 Smart Campus Operations Hub — Admin Booking Management
      </footer>

      {rejectModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200
        }}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "28px", width: "440px", maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#003366", marginBottom: "6px" }}>Reject Booking</div>
            <div style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>Please provide a reason for rejection. This will be visible to the user.</div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Rejection Reason *
            </label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Resource not available for this time slot..."
              rows={3} className="form-input"
              style={{ resize: "vertical", fontSize: "13px", padding: "10px 12px" }}
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button onClick={() => setRejectModal(null)} style={{
                padding: "9px 20px", borderRadius: "8px", border: "1px solid #ddd",
                background: "transparent", cursor: "pointer", fontSize: "13px"
              }}>Cancel</button>
              <button onClick={reject} style={{
                padding: "9px 20px", borderRadius: "8px", border: "none",
                background: "#e53935", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "700"
              }}>Reject Booking</button>
            </div>
          </div>
        </div>
      )}
      <footer className="app-footer">
        © 2026 Smart Campus Operations Hub
      </footer>
    </div>
  );
}