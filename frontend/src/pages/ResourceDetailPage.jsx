import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getResourceById, deleteResource, updateResourceStatus } from "../api/resourceApi";
import toast, { Toaster } from "react-hot-toast";

const statusColor = {
  ACTIVE: "#1D9E75",
  OUT_OF_SERVICE: "#E24B4A",
  UNDER_MAINTENANCE: "#BA7517",
  DECOMMISSIONED: "#888780"
};

const STATUSES = ["ACTIVE", "OUT_OF_SERVICE", "UNDER_MAINTENANCE", "DECOMMISSIONED"];

export default function ResourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      await deleteResource(id);
      toast.success("Resource deleted!");
      navigate("/");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;
  if (!resource) return null;

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <Toaster position="top-right" />

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
      </div>

      {/* Details Grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px", marginBottom: "16px"
      }}>
        {[
          { label: "Capacity", value: resource.capacity || "N/A" },
          { label: "Building", value: resource.building || "N/A" },
          { label: "Floor", value: resource.floor || "N/A" },
          { label: "Booking Tier", value: resource.bookingTier },
          { label: "Buffer Time", value: `${resource.bufferMinutes} min` },
          { label: "Max Booking", value: `${resource.maxBookingHours} hrs` },
          { label: "Max Advance", value: `${resource.maxAdvanceDays} days` },
          { label: "Created By", value: resource.createdBy },
          { label: "Created At", value: new Date(resource.createdAt).toLocaleDateString() },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: "#f9f9f9", borderRadius: "8px", padding: "14px"
          }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>{label}</div>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{
        background: "#fff", border: "1px solid #eee", borderRadius: "12px", padding: "20px"
      }}>
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
    </div>
  );
}