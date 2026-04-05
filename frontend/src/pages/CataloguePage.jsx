import { useEffect, useState } from "react";
import { getResources, deleteResource, updateResourceStatus, getResourceStats } from "../api/resourceApi";
import useResourceStore from "../store/resourceStore";
import toast, { Toaster } from "react-hot-toast";

const RESOURCE_TYPES = [
  "LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT",
  "AUDITORIUM", "GYM", "SWIMMING_POOL", "SPORTS_COURT",
  "GROUND", "STUDY_ROOM", "CONFERENCE_ROOM", "OTHER"
];

const STATUSES = ["ACTIVE", "OUT_OF_SERVICE", "UNDER_MAINTENANCE", "DECOMMISSIONED"];
const TIERS = ["INSTANT", "DELEGATED", "ADMIN"];

const typeBadgeColor = {
  LECTURE_HALL: "#E6F1FB", LAB: "#EAF3DE", MEETING_ROOM: "#EEEDFE",
  EQUIPMENT: "#FAEEDA", AUDITORIUM: "#FAECE7", GYM: "#E1F5EE",
  SWIMMING_POOL: "#E6F1FB", SPORTS_COURT: "#EAF3DE", GROUND: "#FAEEDA",
  STUDY_ROOM: "#EEEDFE", CONFERENCE_ROOM: "#FAECE7", OTHER: "#F1EFE8"
};

const statusColor = {
  ACTIVE: "#1D9E75", OUT_OF_SERVICE: "#E24B4A",
  UNDER_MAINTENANCE: "#BA7517", DECOMMISSIONED: "#888780"
};

export default function CataloguePage() {
  const { filters, setFilters, resetFilters } = useResourceStore();
  const [resources, setResources] = useState([]);
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

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.location) params.location = filters.location;
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
    fetchResources();
    fetchStats();
  }, [filters]);

  const openAddModal = () => {
    setEditingResource(null);
    setForm({
      name: "", type: "LECTURE_HALL", capacity: "", location: "",
      building: "", floor: "", description: "", status: "ACTIVE",
      bookingTier: "INSTANT", bufferMinutes: 15, maxBookingHours: 4, maxAdvanceDays: 14
    });
    setShowModal(true);
  };

  const openEditModal = (resource) => {
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
    if (!form.name || !form.location) {
      toast.error("Name and Location are required!");
      return;
    }
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
      fetchResources();
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save resource");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      await deleteResource(id);
      toast.success("Resource deleted!");
      fetchResources();
      fetchStats();
    } catch {
      toast.error("Failed to delete resource");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateResourceStatus(id, status);
      toast.success("Status updated!");
      fetchResources();
      fetchStats();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      <Toaster position="top-right" />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "600", margin: 0 }}>Facilities & Assets Catalogue</h1>
          <p style={{ fontSize: "13px", color: "#888", margin: "4px 0 0" }}>Smart Campus Operations Hub - Module A</p>
        </div>
        <button onClick={openAddModal} style={{
          padding: "8px 20px", background: "#111", color: "#fff",
          border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px"
        }}>+ Add Resource</button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Total Resources", value: stats.totalResources },
            { label: "Active", value: stats.activeResources, color: "#1D9E75" },
            { label: "Out of Service", value: stats.outOfService, color: "#E24B4A" },
            { label: "Maintenance", value: stats.underMaintenance, color: "#BA7517" }
          ].map((s) => (
            <div key={s.label} style={{ background: "#f5f5f5", borderRadius: "8px", padding: "14px 16px" }}>
              <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>{s.label}</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: s.color || "#111" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: "#fff", border: "1px solid #eee", borderRadius: "12px",
        padding: "14px 16px", marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap"
      }}>
        <input placeholder="Search by name..." value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          style={{ flex: 1, minWidth: "160px", padding: "7px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
        <select value={filters.type} onChange={(e) => setFilters({ type: e.target.value })}
          style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
          <option value="">All types</option>
          {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value })}
          style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <input placeholder="Location..." value={filters.location}
          onChange={(e) => setFilters({ location: e.target.value })}
          style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", width: "120px" }} />
        <input placeholder="Min capacity" type="number" value={filters.minCapacity || ""}
          onChange={(e) => setFilters({ minCapacity: e.target.value })}
          style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", width: "110px" }} />
        <button onClick={resetFilters}
          style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #ddd", background: "transparent", cursor: "pointer", fontSize: "13px" }}>
          Reset
        </button>
      </div>

      {/* Results count */}
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>
        {totalElements} resource{totalElements !== 1 ? "s" : ""} found
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading...</div>
      ) : resources.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>No resources found.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
          {resources.map((r) => (
            <div key={r.id} style={{
              background: "#fff", border: "1px solid #eee", borderRadius: "12px", padding: "16px", cursor: "pointer"
            }} onClick={() => window.location.href = `/resources/${r.id}`}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{
                  fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "20px",
                  background: typeBadgeColor[r.type] || "#f5f5f5"
                }}>{r.type.replace(/_/g, " ")}</span>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColor[r.status], display: "inline-block", marginTop: "4px" }} />
              </div>
              <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>{r.name}</div>
              <div style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>📍 {r.location}</div>
              <div style={{ display: "flex", gap: "16px", paddingTop: "10px", borderTop: "1px solid #eee", marginBottom: "12px" }}>
                {r.capacity && <div><div style={{ fontSize: "10px", color: "#aaa" }}>Capacity</div><div style={{ fontSize: "13px", fontWeight: "600" }}>{r.capacity}</div></div>}
                <div><div style={{ fontSize: "10px", color: "#aaa" }}>Tier</div><div style={{ fontSize: "13px", fontWeight: "600" }}>{r.bookingTier}</div></div>
                <div><div style={{ fontSize: "10px", color: "#aaa" }}>Buffer</div><div style={{ fontSize: "13px", fontWeight: "600" }}>{r.bufferMinutes}m</div></div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => openEditModal(r)} style={{
                  flex: 1, fontSize: "12px", padding: "5px", borderRadius: "6px",
                  border: "1px solid #ddd", background: "transparent", cursor: "pointer"
                }}>Edit</button>
                <select onChange={(e) => handleStatusChange(r.id, e.target.value)} value={r.status}
                  style={{ flex: 1, fontSize: "11px", padding: "5px", borderRadius: "6px", border: "1px solid #ddd" }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
                <button onClick={() => handleDelete(r.id)} style={{
                  fontSize: "12px", padding: "5px 8px", borderRadius: "6px",
                  border: "1px solid #ffcdd2", background: "transparent", color: "#e53935", cursor: "pointer"
                }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "#fff", borderRadius: "12px", padding: "24px",
            width: "480px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto"
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
              { label: "Type", key: "type", options: RESOURCE_TYPES },
              { label: "Status", key: "status", options: STATUSES },
              { label: "Booking Tier", key: "bookingTier", options: TIERS },
            ].map(({ label, key, options }) => (
              <div key={key} style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>{label}</label>
                <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
                  {options.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
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
                background: "#111", color: "#fff", cursor: "pointer", fontSize: "13px"
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}