package smart_campus_api.dto;

import java.time.LocalDateTime;

public class CommentResponseDTO {

    private Long id;
    private Long ticketId;
    private String comment;
    private String commentedBy;
    private boolean isEdited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getCommentedBy() { return commentedBy; }
    public void setCommentedBy(String commentedBy) { this.commentedBy = commentedBy; }

    public boolean isEdited() { return isEdited; }
    public void setEdited(boolean edited) { isEdited = edited; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
