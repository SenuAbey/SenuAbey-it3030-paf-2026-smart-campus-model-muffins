import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AppHeader from "../components/AppHeader";

const BASE = "http://localhost:8081/api/v1";
const TIERS = ["INSTANT", "DELEGATED", "ADMIN"];

export default function ResourceGroupPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form, setForm] = useState({
    name: "", description: "", delegateRole: "",
    defaultTier: "INSTANT", maxBookingHours: 4, maxAdvanceDays: 14
  });

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${BASE}/resource-groups`);
      const data = await res.json();
      setGroups(data);
    } catch {
      toast.error("Failed to load groups");
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const openAddModal = () => {
    setEditingGroup(null);
    setForm({ name: "", description: "", delegateRole: "", defaultTier: "INSTANT", maxBookingHours: 4, maxAdvanceDays: 14 });
    setShowModal(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setForm({
      name: group.name, description: group.description || "",
      delegateRole: group.delegateRole || "", defaultTier: group.defaultTier,
      maxBookingHours: group.maxBookingHours, maxAdvanceDays: group.maxAdvanceDays
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) { toast.error("Name is required!"); return; }
    try {
      const url = editingGroup ? `${BASE}/resource-groups/${editingGroup.id}` : `${BASE}/resource-groups`;
      const method = editingGroup ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, maxBookingHours: parseInt(form.maxBookingHours), maxAdvanceDays: parseInt(form.maxAdvanceDays) })
      });
      if (res.ok) {
        toast.success(editingGroup ? "Group updated!" : "Group created!");
        setShowModal(false);
        fetchGroups();
      } else {
        toast.error("Failed to save group");
      }
    } catch {
      toast.error("Failed to save group");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this group?")) return;
    try {
      const res = await fetch(`${BASE}/resource-groups/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Group deleted!");
        fetchGroups();
      } else {
        toast.error("Failed to delete group");
      }
    } catch {
      toast.error("Failed to delete group");
    }
  };

  const tierColor = { INSTANT: "#1D9E75", DELEGATED: "#BA7517", ADMIN: "#185FA5" };
  const tierBg = { INSTANT: "#E1F5EE", DELEGATED: "#FAEEDA", ADMIN: "#E6F1FB" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg, #f5f6fa)" }}>
      <Toaster position="top-right" />
      <AppHeader
        extraNavButtons={
          <button onClick={openAddModal} className="btn btn-primary">
            + Add Group
          </button>
        }
      />

      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "600", margin: 0 }}>Resource Groups</h1>
          <p style={{ fontSize: "13px", color: "#888", margin: "4px 0 0" }}>Manage asset categories and booking policies</p>
        </div>

      {groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>No groups yet. Create one!</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
          {groups.map((g) => (
            <div key={g.id} style={{
              background: "#fff", border: "1px solid #eee", borderRadius: "12px", padding: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <h2 style={{ fontSize: "15px", fontWeight: "600", margin: 0 }}>{g.name}</h2>
                <span style={{
                  fontSize: "10px", fontWeight: "600", padding: "3px 8px", borderRadius: "20px",
                  background: tierBg[g.defaultTier], color: tierColor[g.defaultTier]
                }}>{g.defaultTier}</span>
              </div>

              {g.description && (
                <p style={{ fontSize: "13px", color: "#888", marginBottom: "12px", lineHeight: "1.5" }}>{g.description}</p>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                {[
                  { label: "Max booking", value: `${g.maxBookingHours} hrs` },
                  { label: "Max advance", value: `${g.maxAdvanceDays} days` },
                  { label: "Delegate role", value: g.delegateRole || "N/A" },
                  { label: "Created", value: new Date(g.createdAt).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "#f9f9f9", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px" }}>{label}</div>
                    <div style={{ fontSize: "12px", fontWeight: "600" }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => openEditModal(g)} style={{
                  flex: 1, fontSize: "12px", padding: "6px", borderRadius: "6px",
                  border: "1px solid #ddd", background: "transparent", cursor: "pointer"
                }}>Edit</button>
                <button onClick={() => handleDelete(g.id)} style={{
                  fontSize: "12px", padding: "6px 12px", borderRadius: "6px",
                  border: "1px solid #ffcdd2", background: "transparent", color: "#e53935", cursor: "pointer"
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "#fff", borderRadius: "12px", padding: "24px",
            width: "440px", maxWidth: "95vw"
          }}>
            <h2 style={{ fontSize: "17px", fontWeight: "600", marginBottom: "20px" }}>
              {editingGroup ? "Edit Group" : "Add New Group"}
            </h2>

            {[
              { label: "Group name *", key: "name", type: "text" },
              { label: "Description", key: "description", type: "text" },
              { label: "Delegate role", key: "delegateRole", type: "text", placeholder: "e.g. FACULTY_COORDINATOR" },
              { label: "Max booking hours", key: "maxBookingHours", type: "number" },
              { label: "Max advance days", key: "maxAdvanceDays", type: "number" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>{label}</label>
                <input type={type} value={form[key]} placeholder={placeholder || ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }} />
              </div>
            ))}

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>Default tier</label>
              <select value={form.defaultTier} onChange={(e) => setForm({ ...form, defaultTier: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}>
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

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
    </div>
  );
}