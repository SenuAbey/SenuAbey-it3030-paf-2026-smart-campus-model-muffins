package smart_campus_api.dto;

import smart_campus_api.enums.BookingStatus;
import java.time.LocalDateTime;
//This is the output object. When the backend responds to any booking request, it converts the Booking entity into this DTO and sends it as JSON.
// It controls exactly what data is sent to the frontend.
//what the API sends back to the frontend:

public class BookingResponseDTO {
    private Long id;
    private String resourceId;
    private String resourceName;
    private String bookedBy;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private Integer attendees;
    private BookingStatus status;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean checkedIn;
    private LocalDateTime checkedInAt;

    // Getters
    public Long getId() { return id; }
    public String getResourceId() { return resourceId; }
    public String getResourceName() { return resourceName; }
    public String getBookedBy() { return bookedBy; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public String getPurpose() { return purpose; }
    public Integer getAttendees() { return attendees; }
    public BookingStatus getStatus() { return status; }
    public String getRejectionReason() { return rejectionReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public boolean isCheckedIn() { return checkedIn; }
    public LocalDateTime getCheckedInAt() { return checkedInAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public void setResourceName(String resourceName) { this.resourceName = resourceName; }
    public void setBookedBy(String bookedBy) { this.bookedBy = bookedBy; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public void setAttendees(Integer attendees) { this.attendees = attendees; }
    public void setStatus(BookingStatus status) { this.status = status; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setCheckedIn(boolean checkedIn) { this.checkedIn = checkedIn; }
    public void setCheckedInAt(LocalDateTime checkedInAt) { this.checkedInAt = checkedInAt; }
}