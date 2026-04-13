package smart_campus_api.dto;

public class TicketAssignDTO {

    // Frontend sends technicianId (from technician panel) OR assignedTo (email string)
    private Long technicianId;
    private String assignedTo;

    public Long getTechnicianId() { return technicianId; }
    public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
}
