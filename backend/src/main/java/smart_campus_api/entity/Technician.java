package smart_campus_api.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import smart_campus_api.enums.TicketCategory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "technicians")
public class Technician {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "profile_image")
    private String profileImage;

    // Specializations — which ticket categories this technician handles
    // Stored as comma-separated enum names e.g. "ELECTRICAL,HVAC,PLUMBING"
    @Column(name = "specializations", length = 500)
    private String specializations;

    @Column(name = "is_available")
    private boolean available = true;

    // Rating fields
    @Column(name = "total_rating_score")
    private double totalRatingScore = 0.0;

    @Column(name = "rating_count")
    private int ratingCount = 0;

    // Average rating — computed: totalRatingScore / ratingCount
    @Column(name = "average_rating")
    private double averageRating = 0.0;

    // Active ticket count — updated on assign/resolve
    @Column(name = "active_ticket_count")
    private int activeTicketCount = 0;

    // Total completed tickets
    @Column(name = "completed_ticket_count")
    private int completedTicketCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
    public String getSpecializations() { return specializations; }
    public void setSpecializations(String specializations) { this.specializations = specializations; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
    public double getTotalRatingScore() { return totalRatingScore; }
    public void setTotalRatingScore(double totalRatingScore) { this.totalRatingScore = totalRatingScore; }
    public int getRatingCount() { return ratingCount; }
    public void setRatingCount(int ratingCount) { this.ratingCount = ratingCount; }
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public int getActiveTicketCount() { return activeTicketCount; }
    public void setActiveTicketCount(int activeTicketCount) { this.activeTicketCount = activeTicketCount; }
    public int getCompletedTicketCount() { return completedTicketCount; }
    public void setCompletedTicketCount(int completedTicketCount) { this.completedTicketCount = completedTicketCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper: get specializations as list
    public List<String> getSpecializationList() {
        if (specializations == null || specializations.isBlank()) return new ArrayList<>();
        return List.of(specializations.split(","));
    }

    // Helper: check if handles a given category
    public boolean handlesCategory(String category) {
        return getSpecializationList().contains(category) ||
               getSpecializationList().contains("OTHER");
    }
}
