package smart_campus_api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smart_campus_api.dto.CommentRequestDTO;
import smart_campus_api.dto.CommentResponseDTO;
import smart_campus_api.entity.IncidentTicket;
import smart_campus_api.entity.TicketComment;
import smart_campus_api.repository.IncidentTicketRepository;
import smart_campus_api.repository.TicketCommentRepository;
import smart_campus_api.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TicketCommentService {

    @Autowired
    private TicketCommentRepository commentRepository;

    @Autowired
    private IncidentTicketRepository ticketRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    public CommentResponseDTO addComment(Long ticketId, CommentRequestDTO dto) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setComment(dto.getComment());
        comment.setCommentedBy(dto.getCommentedBy());

        TicketComment saved = commentRepository.save(comment);

        // Only notify admins if the commenter is NOT an admin
        boolean isAdmin = userRepository.findByEmail(dto.getCommentedBy())
                .map(u -> u.getRole().name().equals("ADMIN"))
                .orElse(false);
        if (!isAdmin) {
            notificationService.notifyAdminsNewComment(dto.getCommentedBy(), ticket.getTitle(), ticketId);
        }

        return toDTO(saved);
    }

    public List<CommentResponseDTO> getCommentsByTicket(Long ticketId) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CommentResponseDTO editComment(Long ticketId, Long commentId, CommentRequestDTO dto) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));

        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new RuntimeException("Comment does not belong to ticket " + ticketId);
        }

        // Only the comment owner can edit
        if (!comment.getCommentedBy().equals(dto.getCommentedBy())) {
            throw new RuntimeException("You do not have permission to edit this comment. Only the original author can edit.");
        }

        comment.setComment(dto.getComment());
        comment.setEdited(true);

        TicketComment saved = commentRepository.save(comment);
        return toDTO(saved);
    }

    public void deleteComment(Long ticketId, Long commentId, String requestedBy) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));

        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new RuntimeException("Comment does not belong to ticket " + ticketId);
        }

        // Only the comment owner or admin can delete
        if (!comment.getCommentedBy().equals(requestedBy) && !requestedBy.equals("admin")) {
            throw new RuntimeException("You do not have permission to delete this comment.");
        }

        commentRepository.delete(comment);
    }

    private CommentResponseDTO toDTO(TicketComment comment) {
        CommentResponseDTO dto = new CommentResponseDTO();
        dto.setId(comment.getId());
        dto.setTicketId(comment.getTicket().getId());
        dto.setComment(comment.getComment());
        dto.setCommentedBy(comment.getCommentedBy());
        dto.setEdited(comment.isEdited());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        return dto;
    }
}
