package smart_campus_api.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import smart_campus_api.dto.CommentRequestDTO;
import smart_campus_api.dto.CommentResponseDTO;
import smart_campus_api.entity.IncidentTicket;
import smart_campus_api.entity.TicketComment;
import smart_campus_api.enums.TicketCategory;
import smart_campus_api.enums.TicketPriority;
import smart_campus_api.enums.TicketStatus;
import smart_campus_api.repository.IncidentTicketRepository;
import smart_campus_api.repository.TicketCommentRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TicketCommentService Unit Tests")
class TicketCommentServiceTest {

    @Mock
    private TicketCommentRepository commentRepository;

    @Mock
    private IncidentTicketRepository ticketRepository;

    @InjectMocks
    private TicketCommentService commentService;

    private IncidentTicket ticket;
    private TicketComment comment;

    @BeforeEach
    void setUp() {
        ticket = new IncidentTicket();
        ticket.setId(1L);
        ticket.setTitle("Test Ticket");
        ticket.setDescription("Test description");
        ticket.setCategory(TicketCategory.ELECTRICAL);
        ticket.setPriority(TicketPriority.MEDIUM);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setReportedBy("user@sliit.lk");

        comment = new TicketComment();
        comment.setId(10L);
        comment.setTicket(ticket);
        comment.setComment("This is still broken after two days.");
        comment.setCommentedBy("user@sliit.lk");
        comment.setEdited(false);
        comment.setCreatedAt(LocalDateTime.now().minusHours(1));
        comment.setUpdatedAt(LocalDateTime.now().minusHours(1));
    }

    // ─── ADD COMMENT ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("addComment() — should save and return comment DTO")
    void addComment_shouldSaveAndReturn() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(commentRepository.save(any(TicketComment.class))).thenAnswer(inv -> {
            TicketComment c = inv.getArgument(0);
            c.setId(10L);
            c.setCreatedAt(LocalDateTime.now());
            c.setUpdatedAt(LocalDateTime.now());
            return c;
        });

        CommentRequestDTO dto = new CommentRequestDTO();
        dto.setComment("This is still broken after two days.");
        dto.setCommentedBy("user@sliit.lk");

        CommentResponseDTO result = commentService.addComment(1L, dto);

        assertNotNull(result);
        assertEquals("This is still broken after two days.", result.getComment());
        assertEquals("user@sliit.lk", result.getCommentedBy());
        assertFalse(result.isEdited());
        verify(commentRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("addComment() — should throw when ticket does not exist")
    void addComment_shouldThrowWhenTicketNotFound() {
        when(ticketRepository.findById(99L)).thenReturn(Optional.empty());

        CommentRequestDTO dto = new CommentRequestDTO();
        dto.setComment("Some comment");
        dto.setCommentedBy("user@sliit.lk");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> commentService.addComment(99L, dto));

        assertTrue(ex.getMessage().contains("not found"));
    }

    // ─── GET COMMENTS ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getCommentsByTicket() — should return list of comments")
    void getCommentsByTicket_shouldReturnList() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc(1L))
                .thenReturn(List.of(comment));

        List<CommentResponseDTO> results = commentService.getCommentsByTicket(1L);

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("This is still broken after two days.", results.get(0).getComment());
    }

    // ─── EDIT COMMENT ────────────────────────────────────────────────────────

    @Test
    @DisplayName("editComment() — original author can edit their comment")
    void editComment_authorCanEdit() {
        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));
        when(commentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CommentRequestDTO dto = new CommentRequestDTO();
        dto.setComment("Updated: technician was called but still not fixed.");
        dto.setCommentedBy("user@sliit.lk"); // same as comment owner

        CommentResponseDTO result = commentService.editComment(1L, 10L, dto);

        assertEquals("Updated: technician was called but still not fixed.", result.getComment());
        assertTrue(result.isEdited());
    }

    @Test
    @DisplayName("editComment() — different user cannot edit someone else's comment")
    void editComment_otherUserCannotEdit() {
        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));

        CommentRequestDTO dto = new CommentRequestDTO();
        dto.setComment("Trying to edit someone else's comment");
        dto.setCommentedBy("intruder@sliit.lk"); // different from owner

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> commentService.editComment(1L, 10L, dto));

        assertTrue(ex.getMessage().toLowerCase().contains("permission"));
    }

    @Test
    @DisplayName("editComment() — should throw when comment belongs to different ticket")
    void editComment_commentOnWrongTicket_shouldThrow() {
        IncidentTicket otherTicket = new IncidentTicket();
        otherTicket.setId(99L);
        comment.setTicket(otherTicket); // comment belongs to ticket 99, not 1

        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));

        CommentRequestDTO dto = new CommentRequestDTO();
        dto.setComment("Edited");
        dto.setCommentedBy("user@sliit.lk");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> commentService.editComment(1L, 10L, dto));

        assertTrue(ex.getMessage().contains("does not belong"));
    }

    // ─── DELETE COMMENT ──────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteComment() — original author can delete their comment")
    void deleteComment_authorCanDelete() {
        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));

        commentService.deleteComment(1L, 10L, "user@sliit.lk");

        verify(commentRepository, times(1)).delete(comment);
    }

    @Test
    @DisplayName("deleteComment() — admin can delete any comment")
    void deleteComment_adminCanDeleteAnyone() {
        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));

        commentService.deleteComment(1L, 10L, "admin");

        verify(commentRepository, times(1)).delete(comment);
    }

    @Test
    @DisplayName("deleteComment() — other user cannot delete someone else's comment")
    void deleteComment_otherUserCannotDelete() {
        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> commentService.deleteComment(1L, 10L, "intruder@sliit.lk"));

        assertTrue(ex.getMessage().toLowerCase().contains("permission"));
        verify(commentRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteComment() — should throw when comment not found")
    void deleteComment_shouldThrowWhenNotFound() {
        when(commentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> commentService.deleteComment(1L, 999L, "user@sliit.lk"));
    }
}
