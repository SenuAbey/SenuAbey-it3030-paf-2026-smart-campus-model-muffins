package smart_campus_api.dto;

import jakarta.validation.constraints.NotNull;
import smart_campus_api.enums.TicketStatus;

public class TicketStatusUpdateDTO {

    @NotNull(message = "Status is required")
    private TicketStatus status;

    private String reason; // Used for rejection reason or resolution notes

    // Getters and Setters
    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
