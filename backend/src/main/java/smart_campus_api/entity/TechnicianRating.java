package smart_campus_api.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "technician_ratings")
public class TechnicianRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "technician_id", nullable = false)
    private Long technicianId;

    @NotNull
    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    // Work quality score 1–5
    @Min(1) @Max(5)
    @Column(name = "quality_score", nullable = false)
    private int qualityScore;

    // Time taken score 1–5 (5 = resolved very fast)
    @Min(1) @Max(5)
    @Column(name = "time_score", nullable = false)
    private int timeScore;

    // Overall = average of quality + time
    @Column(name = "overall_score")
    private double overallScore;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "rated_by")
    private String ratedBy;

    // Hours taken to resolve
    @Column(name = "hours_to_resolve")
    private Long hoursToResolve;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTechnicianId() { return technicianId; }
    public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
    public int getQualityScore() { return qualityScore; }
    public void setQualityScore(int qualityScore) { this.qualityScore = qualityScore; }
    public int getTimeScore() { return timeScore; }
    public void setTimeScore(int timeScore) { this.timeScore = timeScore; }
    public double getOverallScore() { return overallScore; }
    public void setOverallScore(double overallScore) { this.overallScore = overallScore; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getRatedBy() { return ratedBy; }
    public void setRatedBy(String ratedBy) { this.ratedBy = ratedBy; }
    public Long getHoursToResolve() { return hoursToResolve; }
    public void setHoursToResolve(Long hoursToResolve) { this.hoursToResolve = hoursToResolve; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
