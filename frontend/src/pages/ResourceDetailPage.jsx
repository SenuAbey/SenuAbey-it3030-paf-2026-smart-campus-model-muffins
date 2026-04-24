import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getResourceById, deleteResource, updateResourceStatus } from "../api/resourceApi";
import toast, { Toaster } from "react-hot-toast";
import { RoleContext } from "../App";
import AppHeader from "../components/AppHeader";

const statusColor = {
  ACTIVE: "#1D9E75",
  UNDER_MAINTENANCE: "#BA7517",
  OUT_OF_SERVICE: "#E24B4A",
  DECOMMISSIONED: "#888780"
};

const STATUSES = ["ACTIVE", "UNDER_MAINTENANCE","OUT_OF_SERVICE", "DECOMMISSIONED"];

export default function ResourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useContext(RoleContext);
  const isAdmin = role === "ADMIN";

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchResource = async () => {
    try {
      const res = await getResourceById(id);
      setResource(res.data);
    } catch {
      toast.error("Resource not found");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResource(); }, [id]);

  const handleStatusChange = async (status) => {
    try {
      await updateResourceStatus(id, status);
      toast.success("Status updated!");
      fetchResource();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8081/api/v1/resources/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast.success("Resource deleted!");
        navigate("/");
      } else {
        toast.error("Failed to delete - there is a dependecy regarding this resource");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;
  if (!resource) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg, #f5f6fa)" }}>
      <Toaster position="top-right" />
      <AppHeader />

      <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>

      {/* Back button */}
      <button onClick={() => navigate("/")} style={{
        marginBottom: "20px", padding: "7px 16px", borderRadius: "8px",
        border: "1px solid #ddd", background: "transparent", cursor: "pointer", fontSize: "13px"
      }}>← Back to Catalogue</button>

      {/* Header */}
      <div style={{
        background: "#fff", border: "1px solid #eee", borderRadius: "12px",
        padding: "24px", marginBottom: "16px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{
              fontSize: "11px", fontWeight: "600", padding: "3px 8px",
              borderRadius: "20px", background: "#E6F1FB", marginBottom: "10px", display: "inline-block"
            }}>{resource.type.replace(/_/g, " ")}</span>
            <h1 style={{ fontSize: "22px", fontWeight: "600", margin: "8px 0 4px" }}>{resource.name}</h1>
            <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>📍 {resource.location}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              width: "10px", height: "10px", borderRadius: "50%",
              background: statusColor[resource.status], display: "inline-block"
            }} />
            <span style={{ fontSize: "13px", color: statusColor[resource.status], fontWeight: "600" }}>
              {resource.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {resource.description && (
          <p style={{ marginTop: "16px", fontSize: "14px", color: "#555", lineHeight: "1.6" }}>
            {resource.description}
          </p>
        )}

        {/* Image */}
        {resource.imageUrl && (
          <img src={`http://localhost:8081${resource.imageUrl}`} alt={resource.name}
            style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "8px", marginTop: "16px" }} />
        )}

        {/* Image Upload — shown to everyone (member 1's original) */}
        {isAdmin && (
          <div style={{ marginTop: "16px" }}>
            <input type="file" accept="image/*" id="img-upload" style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const formData = new FormData();
                formData.append("file", file);
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`http://localhost:8081/api/v1/resources/${id}/image`, {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData
                  });
                  const data = await res.json();
                  if (res.ok) {
                    toast.success("Image uploaded!");
                    fetchResource();
                  } else {
                    toast.error("Upload failed: " + (data.error || data.message || "Check if you are logged in as Admin"));
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("Upload failed!");
                }
              }}
            />
            <label htmlFor="img-upload" style={{
              display: "inline-block", padding: "7px 16px", borderRadius: "8px",
              border: "1px solid #ddd", cursor: "pointer", fontSize: "13px"
            }}>
              {resource.imageUrl ? "Change Image" : "Upload Image"}
            </label>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
        {[
          { label: "Capacity",     value: resource.capacity || "N/A" },
          { label: "Building",     value: resource.building || "N/A" },
          { label: "Floor",        value: resource.floor || "N/A" },
          { label: "Booking Tier", value: resource.bookingTier },
          { label: "Buffer Time",  value: `${resource.bufferMinutes} min` },
          { label: "Max Booking",  value: `${resource.maxBookingHours} hrs` },
          { label: "Max Advance",  value: `${resource.maxAdvanceDays} days` },
          { label: "Created By",   value: resource.createdBy },
          { label: "Created At",   value: new Date(resource.createdAt).toLocaleDateString() },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#f9f9f9", borderRadius: "8px", padding: "14px" }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>{label}</div>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Status Timeline */}
      <div style={{
        background: "#fff", border: "1px solid #eee", borderRadius: "12px",
        padding: "20px", marginBottom: "16px"
      }}>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "14px" }}>Resource Status</div>
        <div style={{ display: "flex", gap: "0", alignItems: "center" }}>
          {["ACTIVE", "UNDER_MAINTENANCE", "OUT_OF_SERVICE", "DECOMMISSIONED"].map((s, i, arr) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: resource.status === s ? statusColor[s] : "#f0f0f0",
                  border: `2px solid ${resource.status === s ? statusColor[s] : "#ddd"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px"
                }}>
                  {resource.status === s ? "✓" : ""}
                </div>
                <div style={{
                  fontSize: "9px", marginTop: "4px", textAlign: "center",
                  color: resource.status === s ? statusColor[s] : "#aaa",
                  fontWeight: resource.status === s ? "700" : "400"
                }}>{s.replace(/_/g, " ")}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ height: "2px", flex: 1, background: "#eee", marginBottom: "16px" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── STUDENT: Book This Resource button ── */}
      {!isAdmin && resource.status === "ACTIVE" && (
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={() => navigate(`/bookings?resourceId=${resource.id}`)}
            style={{
              width: "100%", padding: "14px", borderRadius: "10px",
              background: "#0053A0", color: "#fff", border: "none",
              cursor: "pointer", fontSize: "15px", fontWeight: "700",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}
          >
            📅 Book This Resource
          </button>
        </div>
      )}

      {!isAdmin && resource.status !== "ACTIVE" && (
        <div style={{
          marginBottom: "16px", padding: "14px", borderRadius: "10px",
          background: "#fff3f3", border: "1px solid #ffd0d0",
          color: "#c0392b", fontSize: "14px", fontWeight: "600", textAlign: "center"
        }}>
          ⛔ This resource is currently not available for booking ({resource.status.replace(/_/g, " ")})
        </div>
      )}

      {/* ── ADMIN: Update Status + Delete (only once) ── */}
      {isAdmin && (
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Update Status</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => handleStatusChange(s)} style={{
                padding: "7px 14px", borderRadius: "8px", fontSize: "12px", cursor: "pointer",
                border: `1px solid ${statusColor[s]}`,
                background: resource.status === s ? statusColor[s] : "transparent",
                color: resource.status === s ? "#fff" : statusColor[s],
                fontWeight: "500"
              }}>{s.replace(/_/g, " ")}</button>
            ))}
          </div>
          <button onClick={handleDelete} style={{
            padding: "8px 20px", borderRadius: "8px", border: "1px solid #ffcdd2",
            background: "transparent", color: "#e53935", cursor: "pointer", fontSize: "13px"
          }}>Delete Resource</button>
        </div>
      )}
      </div>
      <footer className="app-footer">
        © 2026 Smart Campus Operations Hub
      </footer>
    </div>
  );
}