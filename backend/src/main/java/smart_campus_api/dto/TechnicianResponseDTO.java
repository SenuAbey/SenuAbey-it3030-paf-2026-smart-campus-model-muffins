package smart_campus_api.dto;

import java.time.LocalDateTime;
import java.util.List;

public class TechnicianResponseDTO {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private List<String> specializations;
    private boolean available;
    private double averageRating;
    private int ratingCount;
    private int activeTicketCount;
    private int completedTicketCount;
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public List<String> getSpecializations() { return specializations; }
    public void setSpecializations(List<String> specializations) { this.specializations = specializations; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public int getRatingCount() { return ratingCount; }
    public void setRatingCount(int ratingCount) { this.ratingCount = ratingCount; }
    public int getActiveTicketCount() { return activeTicketCount; }
    public void setActiveTicketCount(int activeTicketCount) { this.activeTicketCount = activeTicketCount; }
    public int getCompletedTicketCount() { return completedTicketCount; }
    public void setCompletedTicketCount(int completedTicketCount) { this.completedTicketCount = completedTicketCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
