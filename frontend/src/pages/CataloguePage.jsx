import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getResources, deleteResource, updateResourceStatus, getResourceStats } from "../api/resourceApi";
import useResourceStore from "../store/resourceStore";
import toast, { Toaster } from "react-hot-toast";

const BASE = "http://localhost:8081/api/v1";

const RESOURCE_TYPES = [
  "LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT",
  "AUDITORIUM", "GYM", "SWIMMING_POOL", "SPORTS_COURT",
  "GROUND", "STUDY_ROOM", "CONFERENCE_ROOM", "OTHER"
];

const STATUSES = ["ACTIVE", "OUT_OF_SERVICE", "UNDER_MAINTENANCE", "DECOMMISSIONED"];
const TIERS = ["INSTANT", "DELEGATED", "ADMIN"];

const TYPE_META = {
  LECTURE_HALL:    { label: "Lecture Halls",     emoji: "🏫", color: "#E6F1FB", text: "#185FA5", img: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?w=600&q=80" },
  LAB:             { label: "Laboratories",       emoji: "🔬", color: "#EAF3DE", text: "#3B6D11", img: "https://images.unsplash.com/photo-1581092921461-eab62e92c731?w=600&q=80" },
  MEETING_ROOM:    { label: "Meeting Rooms",      emoji: "🤝", color: "#EEEDFE", text: "#534AB7", img: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&q=80" },
  EQUIPMENT:       { label: "Equipment",          emoji: "🎥", color: "#FAEEDA", text: "#854F0B", img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=600&q=80" },
  AUDITORIUM:      { label: "Auditoriums",        emoji: "🎭", color: "#FAECE7", text: "#993C1D", img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80" },
  GYM:             { label: "Gymnasium",          emoji: "💪", color: "#E1F5EE", text: "#0F6E56", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80" },
  SWIMMING_POOL:   { label: "Swimming Pool",      emoji: "🏊", color: "#E6F1FB", text: "#185FA5", img: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&q=80" },
  SPORTS_COURT:    { label: "Sports Courts",      emoji: "🏀", color: "#EAF3DE", text: "#3B6D11", img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80" },
  GROUND:          { label: "Grounds & Fields",   emoji: "⚽", color: "#EAF3DE", text: "#3B6D11", img: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80" },
  STUDY_ROOM:      { label: "Study Rooms",        emoji: "📚", color: "#EEEDFE", text: "#534AB7", img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80" },
  CONFERENCE_ROOM: { label: "Conference Rooms",   emoji: "💼", color: "#FAECE7", text: "#993C1D", img: "https://images.unsplash.com/photo-1505373633560-fa9109017684?w=600&q=80" },
  OTHER:           { label: "Other Resources",    emoji: "📦", color: "#F1EFE8", text: "#5F5E5A", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80" },
};

const statusColor = {
  ACTIVE: "#1D9E75", OUT_OF_SERVICE: "#E24B4A",
  UNDER_MAINTENANCE: "#BA7517", DECOMMISSIONED: "#888780"
};

export default function CataloguePage() {
  const navigate = useNavigate();
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
      RESOURCE_TYPES.forEach(t => {
        counts[t] = all.filter(r => r.type === t).length;
      });
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

  useEffect(() => {
    fetchAllResources();
    fetchStats();
  }, []);

  useEffect(() => {
    if (view === "resources") fetchResources(selectedType);
  }, [filters, view, selectedType]);

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
      toast.success("Resource deleted!");
      fetchResources(selectedType);
      fetchAllResources();
      fetchStats();
    } catch {
      toast.error("Failed to delete resource");
    }
  };

  const handleStatusChange = async (id, status, e) => {
    e.stopPropagation();
    try {
      await updateResourceStatus(id, status);
      toast.success("Status updated!");
      fetchResources(selectedType);
      fetchStats();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "Segoe UI, sans-serif" }}>
      <Toaster position="top-right" />

      {/* Header */}
      <header style={{
        background: "#fff", borderBottom: "4px solid #F39200",
        padding: "12px 5%", display: "flex", justifyContent: "space-between",
        alignItems: "center", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ fontSize: "22px", fontWeight: "800", color: "#0053A0", cursor: "pointer" }}
          onClick={() => { setView("categories"); setSelectedType(null); }}>
          UNI <span style={{ color: "#F39200", fontWeight: "300" }}>Campus Hub</span>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {stats && (
            <span style={{ fontSize: "13px", color: "#888" }}>
              {stats.totalResources} resources · {stats.activeResources} active
            </span>
          )}
          <button onClick={() => navigate("/resource-groups")} style={{
            padding: "7px 14px", borderRadius: "8px", border: "1px solid #ddd",
            background: "transparent", cursor: "pointer", fontSize: "13px"
          }}>Manage Groups</button>
          <button onClick={openAddModal} style={{
            padding: "7px 16px", background: "#0053A0", color: "#fff",
            border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600"
          }}>+ Add Resource</button>
        </div>
      </header>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(rgba(0,51,102,0.88), rgba(0,83,160,0.88)), url('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?w=1200&q=80')",
        backgroundSize: "cover", backgroundPosition: "center",
        color: "#fff", padding: "50px 8%"
      }}>
        {view === "categories" ? (
          <>
            <div style={{ fontSize: "13px", opacity: 0.7, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Smart Campus Operations Hub</div>
            <h1 style={{ fontSize: "36px", fontWeight: "300", margin: "0 0 8px" }}>
              Facilities & Assets <strong style={{ fontWeight: "800" }}>Catalogue</strong>
            </h1>
            <p style={{ opacity: 0.8, margin: 0, fontSize: "15px" }}>Select a category to browse available resources</p>
          </>
        ) : (
          <>
            <button onClick={() => { setView("categories"); setSelectedType(null); resetFilters(); }} style={{
              background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)",
              padding: "7px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", marginBottom: "16px"
            }}>← All Categories</button>
            <h1 style={{ fontSize: "32px", fontWeight: "300", margin: "0 0 6px" }}>
              {TYPE_META[selectedType]?.emoji} <strong style={{ fontWeight: "800" }}>{TYPE_META[selectedType]?.label}</strong>
            </h1>
            <p style={{ opacity: 0.8, margin: 0, fontSize: "14px" }}>{totalElements} resource{totalElements !== 1 ? "s" : ""} available</p>
          </>
        )}
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 20px" }}>

        {/* Stats Row */}
        {view === "categories" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "30px" }}>
            {[
              { label: "Total resources", value: stats.totalResources, color: "#0053A0" },
              { label: "Active", value: stats.activeResources, color: "#1D9E75" },
              { label: "Out of service", value: stats.outOfService, color: "#E24B4A" },
              { label: "Maintenance", value: stats.underMaintenance, color: "#BA7517" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", borderRadius: "10px", padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>{s.label}</div>
                <div style={{ fontSize: "28px", fontWeight: "700", color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Categories View */}
        {view === "categories" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {RESOURCE_TYPES.filter(t => categoryCounts[t] > 0).map(type => {
              const meta = TYPE_META[type];
              return (
                <div key={type} onClick={() => handleCategoryClick(type)} style={{
                  background: "#fff", borderRadius: "12px", overflow: "hidden",
                  border: "1px solid #e0e0e0", cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 25px rgba(0,0,0,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}>
                  <div style={{ height: "160px", overflow: "hidden" }}>
                    <img src={meta.img} alt={meta.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <div style={{ fontSize: "11px", color: "#F39200", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Category</div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#003366", marginBottom: "6px" }}>{meta.emoji} {meta.label}</div>
                    <div style={{ fontSize: "13px", color: "#888" }}>{categoryCounts[type]} resource{categoryCounts[type] !== 1 ? "s" : ""} available</div>
                    <div style={{ marginTop: "12px", height: "4px", background: "#eee", borderRadius: "4px" }}>
                      <div style={{ height: "100%", background: "#0053A0", borderRadius: "4px", width: `${Math.min(100, (categoryCounts[type] / 5) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resources View */}
        {view === "resources" && (
          <>
            {/* Filters */}
            <div style={{
              background: "#fff", borderRadius: "10px", padding: "14px 16px",
              marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}>
              <input placeholder="Search by name..." value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                style={{ flex: 1, minWidth: "160px", padding: "7px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
              <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value })}
                style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
                <option value="">All statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
              <input placeholder="Min capacity" type="number" value={filters.minCapacity || ""}
                onChange={(e) => setFilters({ minCapacity: e.target.value })}
                style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", width: "120px" }} />
              <button onClick={resetFilters} style={{
                padding: "7px 14px", borderRadius: "8px", border: "1px solid #ddd",
                background: "transparent", cursor: "pointer", fontSize: "13px"
              }}>Reset</button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>Loading...</div>
            ) : resources.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>No resources found.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                {resources.map(r => (
                  <div key={r.id} onClick={() => navigate(`/resources/${r.id}`)} style={{
                    background: "#fff", borderRadius: "12px", overflow: "hidden",
                    border: "1px solid #e0e0e0", cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column",
                    transition: "transform 0.2s, box-shadow 0.2s"
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 25px rgba(0,0,0,0.12)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}>

                    {/* Card Image */}
                    <div style={{ height: "160px", overflow: "hidden", position: "relative" }}>
                      <img
                        src={r.imageUrl ? `http://localhost:8081${r.imageUrl}` : TYPE_META[r.type]?.img}
                        alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { e.target.src = TYPE_META[r.type]?.img; }}
                      />
                      <div style={{
                        position: "absolute", top: "10px", right: "10px",
                        background: "rgba(0,0,0,0.55)", color: "#fff",
                        padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                        backdropFilter: "blur(4px)"
                      }}>{r.status.replace(/_/g, " ")}</div>
                    </div>

                    <div style={{ padding: "16px 18px", flex: 1 }}>
                      <div style={{ fontSize: "11px", color: "#F39200", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                        {TYPE_META[r.type]?.label}
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#003366", marginBottom: "6px" }}>{r.name}</div>
                      <div style={{ fontSize: "12px", color: "#888", marginBottom: "10px" }}>📍 {r.location}</div>

                      {r.capacity && (
                        <>
                          <div style={{ height: "4px", background: "#eee", borderRadius: "4px", marginBottom: "4px" }}>
                            <div style={{ height: "100%", background: statusColor[r.status], borderRadius: "4px", width: "40%" }} />
                          </div>
                          <div style={{ fontSize: "11px", color: "#999" }}>Capacity: {r.capacity}</div>
                        </>
                      )}

                      <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                        <button onClick={(e) => openEditModal(r, e)} style={{
                          flex: 1, fontSize: "12px", padding: "6px", borderRadius: "6px",
                          border: "1px solid #ddd", background: "transparent", cursor: "pointer"
                        }}>Edit</button>
                        <select onClick={e => e.stopPropagation()} onChange={(e) => handleStatusChange(r.id, e.target.value, e)} value={r.status}
                          style={{ flex: 1, fontSize: "11px", padding: "5px", borderRadius: "6px", border: "1px solid #ddd" }}>
                          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                        <button onClick={(e) => handleDelete(r.id, e)} style={{
                          fontSize: "12px", padding: "6px 10px", borderRadius: "6px",
                          border: "1px solid #ffcdd2", background: "transparent", color: "#e53935", cursor: "pointer"
                        }}>Del</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: "#222", color: "#fff", padding: "30px 10%", textAlign: "center", fontSize: "13px", marginTop: "40px" }}>
        © 2026 Smart Campus Operations Hub
      </footer>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200
        }}>
          <div style={{
            background: "#fff", borderRadius: "12px", padding: "24px",
            width: "500px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto"
          }}>
            <h2 style={{ fontSize: "17px", fontWeight: "600", marginBottom: "20px" }}>
              {editingResource ? "Edit Resource" : "Add New Resource"}
            </h2>
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
              <div key={key} style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>{label}</label>
                <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
              </div>
            ))}
            {[
              { label: "Type", key: "type", options: RESOURCE_TYPES.map(t => ({ value: t, label: TYPE_META[t]?.label || t })) },
              { label: "Status", key: "status", options: STATUSES.map(s => ({ value: s, label: s.replace(/_/g, " ") })) },
              { label: "Booking Tier", key: "bookingTier", options: TIERS.map(t => ({ value: t, label: t })) },
            ].map(({ label, key, options }) => (
              <div key={key} style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>{label}</label>
                <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setShowModal(false)} style={{
                padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd",
                background: "transparent", cursor: "pointer", fontSize: "13px"
              }}>Cancel</button>
              <button onClick={handleSubmit} style={{
                padding: "8px 20px", borderRadius: "8px", border: "none",
                background: "#0053A0", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "600"
              }}>Save Resource</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}