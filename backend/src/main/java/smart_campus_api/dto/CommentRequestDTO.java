package smart_campus_api.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public class CommentRequestDTO {

    @NotBlank(message = "Comment text is required")
    private String comment;

    @NotBlank(message = "Commenter identity is required")
    private String commentedBy;

    // Getters and Setters
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getCommentedBy() { return commentedBy; }
    public void setCommentedBy(String commentedBy) { this.commentedBy = commentedBy; }
}
