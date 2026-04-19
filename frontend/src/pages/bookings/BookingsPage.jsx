import { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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

function BookingCard({ booking, onCancel }) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const durMs = end - start;
  const durH = Math.floor(durMs / 3600000);
  const durM = Math.floor((durMs % 3600000) / 60000);

  return (
    <div style={{
      background: "#fff", border: "1px solid #eee", borderRadius: "12px", padding: "20px",
      display: "flex", flexDirection: "column", gap: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)", transition: "transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.09)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: "700", color: "#003366", marginBottom: "3px" }}>{booking.resourceName}</div>
          <div style={{ fontSize: "12px", color: "#888" }}>{booking.bookedBy}</div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div style={{
        background: "#f7f9fb", borderRadius: "8px", padding: "12px",
        display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "8px"
      }}>
        <div>
          <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Start</div>
          <div style={{ fontSize: "13px", fontWeight: "600" }}>{start.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
          <div style={{ fontSize: "12px", color: "#555" }}>{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px" }}>→</div>
          <div style={{ fontSize: "10px", color: "#aaa" }}>{durH}h{durM > 0 ? ` ${durM}m` : ""}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>End</div>
          <div style={{ fontSize: "13px", fontWeight: "600" }}>{end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
          <div style={{ fontSize: "12px", color: "#555" }}>{end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {booking.purpose && (
          <span style={{ fontSize: "12px", color: "#555", background: "#f0f2f5", padding: "3px 10px", borderRadius: "20px" }}>🎯 {booking.purpose}</span>
        )}
        {booking.attendees && (
          <span style={{ fontSize: "12px", color: "#555", background: "#f0f2f5", padding: "3px 10px", borderRadius: "20px" }}>👥 {booking.attendees}</span>
        )}
      </div>

      {booking.rejectionReason && (
        <div style={{ background: "#fff3f3", border: "1px solid #ffd0d0", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#c0392b" }}>
          <strong>Rejection reason:</strong> {booking.rejectionReason}
        </div>
      )}

      {booking.status === "APPROVED" && (
        <button onClick={() => onCancel(booking.id)} style={{
          padding: "8px", borderRadius: "8px", border: "1px solid #ffcdd2",
          background: "transparent", color: "#e53935", cursor: "pointer", fontSize: "13px", fontWeight: "600", width: "100%"
        }}>Cancel Booking</button>
      )}
    </div>
  );
}

export default function BookingsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { role } = useContext(RoleContext);
  const { user, logoutUser } = useAuthStore();
  const isAdmin = role === "ADMIN";

  const preselectedId = searchParams.get("resourceId") || "";

  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("new");

  const [form, setForm] = useState({
    resourceId: preselectedId, bookedBy: "", startTime: "", endTime: "", purpose: "", attendees: 1,
  });

  useEffect(() => {
    axios.get(`${API}/resources?size=100`, authConfig())
      .then(r => setResources(r.data.content || r.data))
      .catch(() => {});
    // Auto-fill email from logged in user
    if (user?.email) {
      setForm(f => ({ ...f, bookedBy: user.email }));
    }
  }, [user]);

  const fetchMyBookings = async () => {
    if (!form.bookedBy) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/bookings/my?email=${form.bookedBy}`, authConfig());
      setBookings(res.data);
    } catch { } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.resourceId) { toast.error("Please select a resource"); return; }
    if (!form.bookedBy) { toast.error("Please enter your email"); return; }
    if (!form.startTime || !form.endTime) { toast.error("Please select start and end times"); return; }
    if (new Date(form.endTime) <= new Date(form.startTime)) { toast.error("End time must be after start time"); return; }
    if (!form.purpose.trim()) { toast.error("Please enter the purpose of booking"); return; }

    if (selectedResource?.capacity && parseInt(form.attendees) > selectedResource.capacity) {
      toast.error(`Attendees (${form.attendees}) exceeds room capacity (${selectedResource.capacity})`);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/bookings`, { ...form, attendees: parseInt(form.attendees) || 1 }, authConfig());
      toast.success("Booking request submitted! Awaiting admin approval.");
      setForm(f => ({ ...f, startTime: "", endTime: "", purpose: "", attendees: 1 }));
      setActiveTab("mine");
      fetchMyBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed — possible scheduling conflict");
    } finally { setSubmitting(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await axios.patch(`${API}/bookings/${id}/cancel`, {}, authConfig());
      toast.success("Booking cancelled");
      fetchMyBookings();
    } catch { toast.error("Failed to cancel booking"); }
  };

  const selectedResource = resources.find(r => String(r.id) === String(form.resourceId));
  const filtered = filterStatus ? bookings.filter(b => b.status === filterStatus) : bookings;
  const counts = Object.fromEntries(Object.keys(STATUS_META).map(s => [s, bookings.filter(b => b.status === s).length]));

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

          {isAdmin && (
            <button className="btn btn-secondary" onClick={() => navigate("/technicians")}>
              👷 Manage Technicians
            </button>
          )}

          {isAdmin && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate("/admin/bookings")}>
                📋 Manage Bookings
              </button>
              <button className="btn btn-secondary" onClick={() => navigate("/resource-groups")}>
                🗂️ Manage Groups
              </button>
            </>
          )}

          {!isAdmin && (
            <button className="btn btn-secondary" onClick={() => navigate("/bookings")}>
              📅 My Bookings
            </button>
          )}

          <button className="btn btn-secondary" onClick={() => navigate("/")}>
            ← Catalogue
          </button>
        </div>
      </header>

      <div className="app-banner" style={{
        backgroundImage: "linear-gradient(rgba(0,51,102,0.88), rgba(0,83,160,0.88)), url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80')"
      }}>
        {preselectedId && (
          <button onClick={() => navigate(`/resources/${preselectedId}`)} style={{
            background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)",
            padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", marginBottom: "14px", display: "inline-block"
          }}>← Back to Resource</button>
        )}
        <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>My Bookings</div>
        <h1 style={{ fontSize: "36px", fontWeight: "300", margin: "0 0 8px", color: "#fff" }}>Resource <strong style={{ fontWeight: "800" }}>Bookings</strong></h1>
        <p style={{ opacity: 0.8, margin: 0, fontSize: "15px", color: "#fff" }}>Request and track your campus resource bookings</p>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "30px 20px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
          {Object.entries(STATUS_META).map(([status, meta]) => (
            <div key={status} style={{
              background: "#fff", borderRadius: "10px", padding: "16px 20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: `4px solid ${meta.color}`,
              cursor: "pointer", transition: "transform 0.15s",
              outline: filterStatus === status ? `2px solid ${meta.color}` : "none",
            }}
              onClick={() => { setFilterStatus(filterStatus === status ? "" : status); setActiveTab("mine"); }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = ""}
            >
              <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{meta.label}</div>
              <div style={{ fontSize: "26px", fontWeight: "700", color: meta.color }}>{counts[status] || 0}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "#fff", padding: "4px", borderRadius: "10px", border: "1px solid #eee", width: "fit-content" }}>
          {[{ key: "new", label: "📅 New Booking" }, { key: "mine", label: `📋 My Bookings (${bookings.length})` }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "9px 20px", borderRadius: "7px", border: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: "600", transition: "all 0.15s",
              background: activeTab === tab.key ? "var(--sliit-blue)" : "transparent",
              color: activeTab === tab.key ? "#fff" : "#666",
            }}>{tab.label}</button>
          ))}
        </div>

        {activeTab === "new" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #eee", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ background: "var(--sliit-blue)", padding: "18px 24px", color: "#fff" }}>
                <div style={{ fontSize: "16px", fontWeight: "700" }}>New Booking Request</div>
                <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "3px" }}>Fill in all required fields to submit your booking</div>
              </div>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="form-label">Resource *</label>
                  <select value={form.resourceId} onChange={e => setForm(f => ({ ...f, resourceId: e.target.value }))} className="form-input">
                    <option value="">— Select a resource —</option>
                    {resources.map(r => (
                      <option key={r.id} value={r.id} disabled={r.status !== "ACTIVE"}>
                        {r.name} ({r.type?.replace(/_/g, " ")}){r.status !== "ACTIVE" ? ` — ${r.status}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Your Email *</label>
                  <input type="email" placeholder="you@university.ac.lk" value={form.bookedBy}
                    onChange={e => setForm(f => ({ ...f, bookedBy: e.target.value }))} className="form-input" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label className="form-label">Start Time *</label>
                    <input type="datetime-local" value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">End Time *</label>
                    <input type="datetime-local" value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="form-input" />
                  </div>
                </div>

                {form.startTime && form.endTime && new Date(form.endTime) > new Date(form.startTime) && (() => {
                  const ms = new Date(form.endTime) - new Date(form.startTime);
                  const h = Math.floor(ms / 3600000);
                  const m = Math.floor((ms % 3600000) / 60000);
                  return (
                    <div style={{ background: "#E8F8F3", border: "1px solid #b2dfdb", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#1D9E75" }}>
                      ✅ Duration: <strong>{h}h{m > 0 ? ` ${m}m` : ""}</strong>
                      {selectedResource && h > selectedResource.maxBookingHours && (
                        <span style={{ color: "#E24B4A", marginLeft: "8px" }}>⚠️ Exceeds max {selectedResource.maxBookingHours}h</span>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <label className="form-label">Purpose *</label>
                  <input placeholder="e.g. IT3030 Group Meeting, Lab Session" value={form.purpose}
                    onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} className="form-input" />
                </div>

                <div>
                  <label className="form-label">Expected Attendees</label>
                  <input type="number" min="1" max={selectedResource?.capacity || 999} value={form.attendees}
                    onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} className="form-input" />
                  {selectedResource?.capacity && (
                    <div style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>Max capacity: {selectedResource.capacity}</div>
                  )}
                </div>

                <button onClick={handleSubmit} disabled={submitting} style={{
                  padding: "13px", borderRadius: "10px", border: "none",
                  background: submitting ? "#ccc" : "var(--sliit-blue)", color: "#fff",
                  cursor: submitting ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "700"
                }}>{submitting ? "Submitting..." : "Submit Booking Request →"}</button>
                <div style={{ fontSize: "11px", color: "#aaa", textAlign: "center" }}>
                  Your request will be reviewed by an admin before confirmation
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {selectedResource ? (
                <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #eee", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "11px", color: "var(--sliit-orange)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Selected Resource</div>
                    <div style={{ fontSize: "17px", fontWeight: "700", color: "#003366" }}>{selectedResource.name}</div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "3px" }}>📍 {selectedResource.location}</div>
                  </div>
                  <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { label: "Type", value: selectedResource.type?.replace(/_/g, " ") },
                      { label: "Capacity", value: selectedResource.capacity || "N/A" },
                      { label: "Booking Tier", value: selectedResource.bookingTier },
                      { label: "Max Duration", value: `${selectedResource.maxBookingHours} hours` },
                      { label: "Buffer Time", value: `${selectedResource.bufferMinutes} min` },
                      { label: "Max Advance", value: `${selectedResource.maxAdvanceDays} days` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", color: "#aaa" }}>{label}</span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  {selectedResource.bookingTier !== "INSTANT" && (
                    <div style={{ margin: "0 16px 16px", background: "#FFF8EC", border: "1px solid #FFE0A3", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#BA7517" }}>
                      ⚠️ Requires <strong>{selectedResource.bookingTier}</strong> approval
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: "12px", border: "1px dashed #ddd", padding: "40px 20px", textAlign: "center", color: "#bbb" }}>
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>🏫</div>
                  <div style={{ fontSize: "13px" }}>Select a resource to see its details</div>
                </div>
              )}

              <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #eee", padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#555", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Booking Workflow</div>
                {[
                  { icon: "📝", label: "Submit request", color: "#0053A0" },
                  { icon: "⏳", label: "PENDING — admin reviews", color: "#BA7517" },
                  { icon: "✅", label: "APPROVED — confirmed", color: "#1D9E75" },
                  { icon: "❌", label: "REJECTED — reason given", color: "#E24B4A" },
                  { icon: "🚫", label: "You can CANCEL approved bookings", color: "#888" },
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: i < 4 ? "10px" : 0 }}>
                    <span style={{ fontSize: "16px" }}>{step.icon}</span>
                    <div style={{ fontSize: "12px", color: step.color, fontWeight: "500" }}>{step.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "mine" && (
          <div>
            <div style={{
              background: "#fff", border: "1px solid #eee", borderRadius: "10px",
              padding: "14px 18px", marginBottom: "20px",
              display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap"
            }}>
              <span style={{ fontSize: "13px", color: "#555", fontWeight: "600", whiteSpace: "nowrap" }}>Your Email:</span>
              <input
                type="email"
                placeholder="Enter your email to view bookings"
                value={form.bookedBy}
                onChange={e => setForm(f => ({ ...f, bookedBy: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && fetchMyBookings()}
                className="form-input"
                style={{ flex: 1, minWidth: "220px", padding: "8px 12px", fontSize: "13px" }}
              />
              <button onClick={fetchMyBookings} style={{
                padding: "8px 20px", borderRadius: "8px", border: "none",
                background: "var(--sliit-blue, #0053A0)", color: "#fff",
                cursor: "pointer", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap"
              }}>Search</button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#888", marginRight: "4px" }}>Filter:</span>
              <button onClick={() => setFilterStatus("")} style={{
                padding: "6px 14px", borderRadius: "20px",
                border: `1px solid ${!filterStatus ? "var(--sliit-blue)" : "#ddd"}`,
                background: !filterStatus ? "var(--sliit-blue)" : "transparent",
                color: !filterStatus ? "#fff" : "#666", cursor: "pointer", fontSize: "12px", fontWeight: "600"
              }}>All ({bookings.length})</button>
              {Object.entries(STATUS_META).map(([status, meta]) => counts[status] > 0 && (
                <button key={status} onClick={() => setFilterStatus(filterStatus === status ? "" : status)} style={{
                  padding: "6px 14px", borderRadius: "20px",
                  border: `1px solid ${filterStatus === status ? meta.color : "#ddd"}`,
                  background: filterStatus === status ? meta.bg : "transparent",
                  color: filterStatus === status ? meta.color : "#666",
                  cursor: "pointer", fontSize: "12px", fontWeight: "600"
                }}>{meta.icon} {meta.label} ({counts[status]})</button>
              ))}
              <button onClick={fetchMyBookings} style={{
                marginLeft: "auto", padding: "6px 14px", borderRadius: "20px",
                border: "1px solid #ddd", background: "transparent", cursor: "pointer", fontSize: "12px", color: "#666"
              }}>↻ Refresh</button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#aaa" }}>Loading your bookings...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "12px", border: "1px dashed #ddd", color: "#aaa" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
                <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>No bookings found</div>
                <div style={{ fontSize: "13px" }}>{filterStatus ? `No ${STATUS_META[filterStatus]?.label.toLowerCase()} bookings` : "You have no bookings yet"}</div>
                <button onClick={() => setActiveTab("new")} style={{
                  marginTop: "16px", padding: "9px 20px", borderRadius: "8px",
                  background: "var(--sliit-blue)", color: "#fff", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600"
                }}>Make a Booking</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                {filtered.map(b => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="app-footer">© 2026 Smart Campus Operations Hub</footer>
    </div>
  );
}