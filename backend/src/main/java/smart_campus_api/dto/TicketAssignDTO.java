package smart_campus_api.dto;

import jakarta.validation.constraints.NotBlank;

public class TicketAssignDTO {

    @NotBlank(message = "Technician email or name is required")
    private String assignedTo;

    // Getters and Setters
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
}
