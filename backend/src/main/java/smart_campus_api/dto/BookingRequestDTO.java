package smart_campus_api.dto;
//In the dto package — Data Transfer Objects are kept here.
import java.time.LocalDateTime;
//This is the input object. When the frontend sends a POST request to create a booking, the JSON body is automatically converted into this class by Spring.
// It defines exactly what fields the frontend is allowed to send.

//what the frontend sends to create a booking:

public class BookingRequestDTO {            // used to carry data between frontend and backend.
    private String resourceId;
    private String bookedBy;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private Integer attendees;

    // Getters and Setters
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public String getBookedBy() { return bookedBy; }
    public void setBookedBy(String bookedBy) { this.bookedBy = bookedBy; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public Integer getAttendees() { return attendees; }
    public void setAttendees(Integer attendees) { this.attendees = attendees; }
}


//Jackson uses setResourceId() when converting the JSON body into this object.
// BookingService uses getResourceId() to find the resource in the database.