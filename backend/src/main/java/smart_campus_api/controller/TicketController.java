package smart_campus_api.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smart_campus_api.dto.*;
import smart_campus_api.enums.TicketCategory;
import smart_campus_api.enums.TicketPriority;
import smart_campus_api.enums.TicketStatus;
import smart_campus_api.service.TicketAttachmentService;
import smart_campus_api.service.TicketCommentService;
import smart_campus_api.service.TicketService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private TicketAttachmentService attachmentService;

    @Autowired
    private TicketCommentService commentService;

    // ─── TICKET CRUD ─────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/tickets
     * Returns paginated ticket list with optional filters.
     */
    @GetMapping
    public ResponseEntity<Page<TicketResponseDTO>> getAllTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketCategory category,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) String reportedBy,
            @RequestParam(required = false) String assignedTo,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(ticketService.getAllTickets(
                status, category, priority, resourceId, reportedBy, assignedTo, keyword, pageable));
    }

    /**
     * GET /api/v1/tickets/{id}
     * Returns a single ticket with full details (comments + attachments).
     */
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponseDTO> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    /**
     * POST /api/v1/tickets
     * Creates a new incident ticket. Returns 201 Created.
     */
    @PostMapping
    public ResponseEntity<TicketResponseDTO> createTicket(@Valid @RequestBody TicketRequestDTO dto) {
        TicketResponseDTO created = ticketService.createTicket(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/tickets/{id}
     * Updates ticket details (not status — use PATCH for that).
     */
    @PutMapping("/{id}")
    public ResponseEntity<TicketResponseDTO> updateTicket(
            @PathVariable Long id,
            @Valid @RequestBody TicketRequestDTO dto) {
        return ResponseEntity.ok(ticketService.updateTicket(id, dto));
    }

    /**
     * DELETE /api/v1/tickets/{id}
     * Deletes a ticket and all its attachments and comments.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.ok(Map.of("message", "Ticket #" + id + " deleted successfully."));
    }

    // ─── STATUS & ASSIGNMENT ─────────────────────────────────────────────────────

    /**
     * PATCH /api/v1/tickets/{id}/status
     * Updates ticket status. Validates workflow transitions.
     * REJECTED requires a reason. RESOLVED stores resolution notes.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketResponseDTO> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody TicketStatusUpdateDTO dto) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, dto));
    }

    /**
     * PATCH /api/v1/tickets/{id}/assign
     * Assigns a technician to the ticket. Auto-moves status to IN_PROGRESS if OPEN.
     */
    @PatchMapping("/{id}/assign")
    public ResponseEntity<TicketResponseDTO> assignTechnician(
            @PathVariable Long id,
            @Valid @RequestBody TicketAssignDTO dto) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, dto));
    }

    // ─── ATTACHMENTS ─────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/tickets/{id}/attachments
     * Uploads a file attachment (max 3 per ticket, images/PDF only, max 10MB).
     */
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentResponseDTO> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "anonymous") String uploadedBy) {
        AttachmentResponseDTO dto = attachmentService.uploadAttachment(id, file, uploadedBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * GET /api/v1/tickets/{id}/attachments
     * Returns all attachments for a ticket.
     */
    @GetMapping("/{id}/attachments")
    public ResponseEntity<List<AttachmentResponseDTO>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(attachmentService.getAttachmentsByTicket(id));
    }

    /**
     * DELETE /api/v1/tickets/{id}/attachments/{attachmentId}
     * Deletes a specific attachment. Only the uploader or admin can delete.
     */
    @DeleteMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<Map<String, String>> deleteAttachment(
            @PathVariable Long id,
            @PathVariable Long attachmentId,
            @RequestParam(defaultValue = "anonymous") String requestedBy) {
        attachmentService.deleteAttachment(id, attachmentId, requestedBy);
        return ResponseEntity.ok(Map.of("message", "Attachment deleted successfully."));
    }

    // ─── COMMENTS ────────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/tickets/{id}/comments
     * Adds a comment to a ticket.
     */
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponseDTO> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequestDTO dto) {
        CommentResponseDTO comment = commentService.addComment(id, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    /**
     * GET /api/v1/tickets/{id}/comments
     * Returns all comments for a ticket ordered by creation time (oldest first).
     */
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponseDTO>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.getCommentsByTicket(id));
    }

    /**
     * PUT /api/v1/tickets/{id}/comments/{commentId}
     * Edits a comment. Only the original author can edit.
     */
    @PutMapping("/{id}/comments/{commentId}")
    public ResponseEntity<CommentResponseDTO> editComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequestDTO dto) {
        return ResponseEntity.ok(commentService.editComment(id, commentId, dto));
    }

    /**
     * DELETE /api/v1/tickets/{id}/comments/{commentId}
     * Deletes a comment. Only the author or admin can delete.
     */
    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Map<String, String>> deleteComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @RequestParam(defaultValue = "anonymous") String requestedBy) {
        commentService.deleteComment(id, commentId, requestedBy);
        return ResponseEntity.ok(Map.of("message", "Comment deleted successfully."));
    }

    // ─── STATS ───────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/tickets/stats
     * Returns dashboard statistics: counts by status, priority, category, technician workload.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(ticketService.getTicketStats());
    }
}
