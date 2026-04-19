import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getResources, deleteResource, updateResourceStatus, getResourceStats } from "../api/resourceApi";
import useResourceStore from "../store/resourceStore";
import toast, { Toaster } from "react-hot-toast";
import { RoleContext } from "../App";
import { useAuthStore } from "../store/authStore";

const BASE = "http://localhost:8081/api/v1";

const RESOURCE_TYPES = [
  "LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT",
  "AUDITORIUM", "GYM", "SWIMMING_POOL", "SPORTS_COURT",
  "GROUND", "STUDY_ROOM", "CONFERENCE_ROOM", "OTHER"
];

const STATUSES = ["ACTIVE", "OUT_OF_SERVICE", "UNDER_MAINTENANCE", "DECOMMISSIONED"];
const TIERS = ["INSTANT", "DELEGATED", "ADMIN"];

const TYPE_META = {
  LECTURE_HALL:    { label: "Lecture Halls",     emoji: "🏫", img: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?w=600&q=80" },
  LAB:             { label: "Laboratories",       emoji: "🔬", img: "https://images.unsplash.com/photo-1581092921461-eab62e92c731?w=600&q=80" },
  MEETING_ROOM:    { label: "Meeting Rooms",      emoji: "🤝", img: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&q=80" },
  EQUIPMENT:       { label: "Equipment",          emoji: "🎥", img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=600&q=80" },
  AUDITORIUM:      { label: "Auditoriums",        emoji: "🎭", img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80" },
  GYM:             { label: "Gymnasium",          emoji: "💪", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80" },
  SWIMMING_POOL:   { label: "Swimming Pool",      emoji: "🏊", img: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&q=80" },
  SPORTS_COURT:    { label: "Sports Courts",      emoji: "🏀", img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80" },
  GROUND:          { label: "Grounds & Fields",   emoji: "⚽", img: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80" },
  STUDY_ROOM:      { label: "Study Rooms",        emoji: "📚", img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80" },
  CONFERENCE_ROOM: { label: "Conference Rooms",   emoji: "💼", img: "https://images.unsplash.com/photo-1505373633560-fa9109017684?w=600&q=80" },
  OTHER:           { label: "Other Resources",    emoji: "📦", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80" },
};

const statusColor = {
  ACTIVE: "#1D9E75", OUT_OF_SERVICE: "#E24B4A",
  UNDER_MAINTENANCE: "#BA7517", DECOMMISSIONED: "#888780"
};

export default function CataloguePage() {
  const navigate = useNavigate();
  const { role, setRole } = useContext(RoleContext);
  const { user, logoutUser } = useAuthStore();
  const { filters, setFilters, resetFilters } = useResourceStore();
  const [view, setView] = useState("categories");
  const [selectedType, setSelectedType] = useState(null);
  const [resources, setResources] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [totalElements, setTotalElements] = useState(0);
  const [form, setForm] = useState({
    name: "", type: "LECTURE_HALL", capacity: "", location: "",
    building: "", floor: "", description: "", status: "ACTIVE",
    bookingTier: "INSTANT", bufferMinutes: 15, maxBookingHours: 4, maxAdvanceDays: 14
  });

  const fetchAllResources = async () => {
    try {
      const res = await getResources({ size: 100 });
      const all = res.data.content;
      const counts = {};
      RESOURCE_TYPES.forEach(t => { counts[t] = all.filter(r => r.type === t).length; });
      setCategoryCounts(counts);
    } catch {}
  };

  const fetchResources = async (type) => {
    setLoading(true);
    try {
      const params = { size: 100 };
      if (type) params.type = type;
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.minCapacity) params.minCapacity = filters.minCapacity;
      const res = await getResources(params);
      setResources(res.data.content);
      setTotalElements(res.data.totalElements);
    } catch {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await getResourceStats();
      setStats(res.data);
    } catch {}
  };

  useEffect(() => { fetchAllResources(); fetchStats(); }, []);
  useEffect(() => { if (view === "resources") fetchResources(selectedType); }, [filters, view, selectedType]);

  const handleCategoryClick = (type) => {
    setSelectedType(type);
    setView("resources");
    resetFilters();
    fetchResources(type);
  };

  const openAddModal = () => {
    setEditingResource(null);
    setForm({
      name: "", type: selectedType || "LECTURE_HALL", capacity: "", location: "",
      building: "", floor: "", description: "", status: "ACTIVE",
      bookingTier: "INSTANT", bufferMinutes: 15, maxBookingHours: 4, maxAdvanceDays: 14
    });
    setShowModal(true);
  };

  const openEditModal = (resource, e) => {
    e.stopPropagation();
    setEditingResource(resource);
    setForm({
      name: resource.name, type: resource.type,
      capacity: resource.capacity || "", location: resource.location,
      building: resource.building || "", floor: resource.floor || "",
      description: resource.description || "", status: resource.status,
      bookingTier: resource.bookingTier, bufferMinutes: resource.bufferMinutes,
      maxBookingHours: resource.maxBookingHours, maxAdvanceDays: resource.maxAdvanceDays
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.location) { toast.error("Name and Location are required!"); return; }
    try {
      const payload = {
        ...form,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        bufferMinutes: parseInt(form.bufferMinutes),
        maxBookingHours: parseInt(form.maxBookingHours),
        maxAdvanceDays: parseInt(form.maxAdvanceDays)
      };
      if (editingResource) {
        const { updateResource } = await import("../api/resourceApi");
        await updateResource(editingResource.id, payload);
        toast.success("Resource updated!");
      } else {
        const { createResource } = await import("../api/resourceApi");
        await createResource(payload);
        toast.success("Resource created!");
      }
      setShowModal(false);
      fetchResources(selectedType);
      fetchAllResources();
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save resource");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this resource?")) return;
    try {
      await deleteResource(id);
      toast.success("Deleted!");
      fetchResources(selectedType);
      fetchAllResources();
      fetchStats();
    } catch { toast.error("Failed to delete"); }
  };

  const handleStatusChange = async (id, status, e) => {
    e.stopPropagation();
    try {
      await updateResourceStatus(id, status);
      toast.success("Status updated!");
      fetchResources(selectedType);
      fetchStats();
    } catch { toast.error("Failed to update status"); }
  };

  const isAdmin = role === "ADMIN";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Toaster position="top-right" />

      {/* Header */}
      <header className="app-header">
        <div className="app-logo" onClick={() => { setView("categories"); setSelectedType(null); }}>
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
              background: role === "ADMIN" ? "#003366" : "#E87722", color: "#fff"
            }}>
              {role}
            </span>
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
                Manage Groups
              </button>
              <button className="btn btn-primary" onClick={openAddModal}>+ Add Resource</button>
            </>
          )}

          {!isAdmin && (
            <button className="btn btn-secondary" onClick={() => navigate("/bookings")}>
              📅 My Bookings
            </button>
          )}
        </div>
      </header>

      {/* Banner */}
      <div className="app-banner" style={{
        backgroundImage: "linear-gradient(rgba(0,51,102,0.88), rgba(0,83,160,0.88)), url('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?w=1200&q=80')"
      }}>
        {view === "categories" ? (
          <>
            <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Smart Campus Operations Hub
            </div>
            <h1 style={{ fontSize: "36px", fontWeight: "300", margin: "0 0 8px", color: "#fff" }}>
              Facilities & Assets <strong style={{ fontWeight: "800" }}>Catalogue</strong>
            </h1>
            <p style={{ opacity: 0.8, margin: 0, fontSize: "15px", color: "#fff" }}>
              {isAdmin ? "Managing all campus resources" : "Browse and book campus resources"}
            </p>
          </>
        ) : (
          <>
            <button className="btn" onClick={() => { setView("categories"); setSelectedType(null); resetFilters(); }}
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", marginBottom: "16px" }}>
              ← All Categories
            </button>
            <h1 style={{ fontSize: "32px", fontWeight: "300", margin: "0 0 6px", color: "#fff" }}>
              {TYPE_META[selectedType]?.emoji} <strong style={{ fontWeight: "800" }}>{TYPE_META[selectedType]?.label}</strong>
            </h1>
            <p style={{ opacity: 0.8, margin: 0, fontSize: "14px", color: "#fff" }}>
              {totalElements} resource{totalElements !== 1 ? "s" : ""} found
            </p>
          </>
        )}
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 20px" }}>

        {/* Stats - Admin only */}
        {view === "categories" && isAdmin && stats && (
          <div className="stats-grid">
            {[
              { label: "Total resources", value: stats.totalResources, color: "var(--sliit-blue)" },
              { label: "Active", value: stats.activeResources, color: "var(--success)" },
              { label: "Out of service", value: stats.outOfService, color: "var(--danger)" },
              { label: "Maintenance", value: stats.underMaintenance, color: "var(--warning)" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Categories View */}
        {view === "categories" && (
          <div className="card-grid">
            {RESOURCE_TYPES.filter(t => categoryCounts[t] > 0).map(type => {
              const meta = TYPE_META[type];
              return (
                <div key={type} className="card" onClick={() => handleCategoryClick(type)}
                  style={{ cursor: "pointer", overflow: "hidden" }}>
                  <div style={{ height: "160px", overflow: "hidden" }}>
                    <img src={meta.img} alt={meta.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <div style={{ fontSize: "11px", color: "var(--sliit-orange)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Category</div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--sliit-dark)", marginBottom: "6px" }}>{meta.emoji} {meta.label}</div>
                    <div style={{ fontSize: "13px", color: "var(--text-light)" }}>{categoryCounts[type]} resource{categoryCounts[type] !== 1 ? "s" : ""} available</div>
                    <div className="occ-bar"><div className="occ-fill" style={{ width: `${Math.min(100, (categoryCounts[type] / 5) * 100)}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resources View */}
        {view === "resources" && (
          <>
            <div className="filters-bar">
              <input placeholder="Search by name..." value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="form-input" style={{ flex: 1, minWidth: "160px" }} />
              <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value })} className="form-input" style={{ width: "auto" }}>
                <option value="">All statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
              <input placeholder="Min capacity" type="number" value={filters.minCapacity || ""}
                onChange={(e) => setFilters({ minCapacity: e.target.value })}
                className="form-input" style={{ width: "130px" }} />
              <button className="btn btn-secondary" onClick={resetFilters}>Reset</button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--text-light)" }}>Loading...</div>
            ) : resources.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--text-light)" }}>No resources found.</div>
            ) : (
              <div className="card-grid">
                {resources.map(r => (
                  <div key={r.id} className="card" onClick={() => navigate(`/resources/${r.id}`)}
                    style={{ cursor: "pointer", overflow: "hidden", display: "flex", flexDirection: "column" }}>

                    <div style={{ height: "160px", overflow: "hidden", position: "relative" }}>
                      <img
                        src={r.imageUrl ? `http://localhost:8081${r.imageUrl}` : TYPE_META[r.type]?.img}
                        alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { e.target.src = TYPE_META[r.type]?.img; }}
                      />
                      <div style={{
                        position: "absolute", top: "10px", right: "10px",
                        background: "rgba(0,0,0,0.55)", color: "#fff",
                        padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700"
                      }}>{r.status.replace(/_/g, " ")}</div>
                    </div>

                    <div style={{ padding: "16px 18px", flex: 1 }}>
                      <div style={{ fontSize: "11px", color: "var(--sliit-orange)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                        {TYPE_META[r.type]?.label}
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--sliit-dark)", marginBottom: "6px" }}>{r.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-light)", marginBottom: "8px" }}>📍 {r.location}</div>

                      {r.capacity && (
                        <>
                          <div className="occ-bar"><div className="occ-fill" style={{ width: "40%", background: statusColor[r.status] }} /></div>
                          <div style={{ fontSize: "11px", color: "#999" }}>Capacity: {r.capacity}</div>
                        </>
                      )}

                      <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "#E6F1FB", color: "#185FA5", fontWeight: "600" }}>
                          {r.bookingTier}
                        </span>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "#f0f2f5", color: "#888" }}>
                          Max {r.maxBookingHours}h
                        </span>
                      </div>

                      {/* Admin only actions */}
                      {isAdmin && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                          <button onClick={(e) => openEditModal(r, e)} className="btn btn-secondary" style={{ flex: 1, fontSize: "12px", padding: "5px" }}>Edit</button>
                          <select onClick={e => e.stopPropagation()} onChange={(e) => handleStatusChange(r.id, e.target.value, e)} value={r.status}
                            className="form-input" style={{ flex: 1, fontSize: "11px", padding: "5px" }}>
                            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                          </select>
                          <button onClick={(e) => handleDelete(r.id, e)} className="btn btn-danger" style={{ fontSize: "12px", padding: "5px 8px" }}>Del</button>
                        </div>
                      )}

                      {!isAdmin && r.status === "ACTIVE" && (
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/resources/${r.id}`); }}
                          className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
                          View & Book
                        </button>
                      )}

                      {!isAdmin && r.status !== "ACTIVE" && (
                        <div style={{ marginTop: "12px", padding: "6px", borderRadius: "6px", background: "#fff3f3", color: "var(--danger)", fontSize: "12px", textAlign: "center" }}>
                          Not available for booking
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="app-footer">
        © 2026 Smart Campus Operations Hub
      </footer>

      {/* Modal - Admin only */}
      {showModal && isAdmin && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">{editingResource ? "Edit Resource" : "Add New Resource"}</div>
            {[
              { label: "Name *", key: "name", type: "text" },
              { label: "Location *", key: "location", type: "text" },
              { label: "Building", key: "building", type: "text" },
              { label: "Floor", key: "floor", type: "text" },
              { label: "Capacity", key: "capacity", type: "number" },
              { label: "Buffer Minutes", key: "bufferMinutes", type: "number" },
              { label: "Max Booking Hours", key: "maxBookingHours", type: "number" },
              { label: "Max Advance Days", key: "maxAdvanceDays", type: "number" },
              { label: "Description", key: "description", type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key} className="form-field">
                <label className="form-label">{label}</label>
                <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="form-input" />
              </div>
            ))}
            {[
              { label: "Type", key: "type", options: RESOURCE_TYPES.map(t => ({ value: t, label: TYPE_META[t]?.label || t })) },
              { label: "Status", key: "status", options: STATUSES.map(s => ({ value: s, label: s.replace(/_/g, " ") })) },
              { label: "Booking Tier", key: "bookingTier", options: TIERS.map(t => ({ value: t, label: t })) },
            ].map(({ label, key, options }) => (
              <div key={key} className="form-field">
                <label className="form-label">{label}</label>
                <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="form-input">
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Save Resource</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}