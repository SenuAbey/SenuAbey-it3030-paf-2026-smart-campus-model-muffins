package smart_campus_api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class RatingRequestDTO {

    @NotNull
    private Long technicianId;

    @NotNull
    private Long ticketId;

    @Min(1) @Max(5)
    @NotNull(message = "Quality score 1-5 is required")
    private Integer qualityScore;

    @Min(1) @Max(5)
    @NotNull(message = "Time score 1-5 is required")
    private Integer timeScore;

    private String feedback;
    private String ratedBy;

    // Getters and Setters
    public Long getTechnicianId() { return technicianId; }
    public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
    public Integer getQualityScore() { return qualityScore; }
    public void setQualityScore(Integer qualityScore) { this.qualityScore = qualityScore; }
    public Integer getTimeScore() { return timeScore; }
    public void setTimeScore(Integer timeScore) { this.timeScore = timeScore; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getRatedBy() { return ratedBy; }
    public void setRatedBy(String ratedBy) { this.ratedBy = ratedBy; }
}
