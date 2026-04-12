package smart_campus_api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smart_campus_api.dto.*;
import smart_campus_api.entity.IncidentTicket;
import smart_campus_api.entity.TicketAttachment;
import smart_campus_api.entity.TicketComment;
import smart_campus_api.enums.TicketCategory;
import smart_campus_api.enums.TicketPriority;
import smart_campus_api.enums.TicketStatus;
import smart_campus_api.repository.IncidentTicketRepository;
import smart_campus_api.repository.TicketAttachmentRepository;
import smart_campus_api.repository.TicketCommentRepository;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TicketService {

    @Autowired
    private IncidentTicketRepository ticketRepository;

    @Autowired
    private TicketAttachmentRepository attachmentRepository;

    @Autowired
    private TicketCommentRepository commentRepository;

    // Optional: inject ResourceRepository if Module A is available
    // @Autowired(required = false)
    // private ResourceRepository resourceRepository;

    // ─── CREATE ──────────────────────────────────────────────────────────────────

    @Transactional
    public TicketResponseDTO createTicket(TicketRequestDTO dto) {
        IncidentTicket ticket = new IncidentTicket();
        ticket.setTitle(dto.getTitle());
        ticket.setDescription(dto.getDescription());
        ticket.setCategory(dto.getCategory());
        ticket.setPriority(dto.getPriority());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setResourceId(dto.getResourceId());
        ticket.setResourceName(dto.getResourceName());
        ticket.setLocation(dto.getLocation());
        ticket.setReportedBy(dto.getReportedBy());
        ticket.setPreferredContact(dto.getPreferredContact());

        IncidentTicket saved = ticketRepository.save(ticket);

        // Update resource status to UNDER_MAINTENANCE if resourceId is provided
        // This uses a soft approach — the Resource entity update is done via a
        // PATCH call to /api/v1/resources/{id}/status within this service.
        // When OAuth is integrated, this will use the current user's token.
        updateResourceStatusSafe(dto.getResourceId(), "UNDER_MAINTENANCE");

        return toResponseDTO(saved, false);
    }

    // ─── READ ─────────────────────────────────────────────────────────────────────

    public Page<TicketResponseDTO> getAllTickets(
            TicketStatus status,
            TicketCategory category,
            TicketPriority priority,
            Long resourceId,
            String reportedBy,
            String assignedTo,
            String keyword,
            Pageable pageable) {

        // Use unsorted pageable for native query — ORDER BY is not passed from Spring
        // because native queries don't understand camelCase field names (createdAt vs created_at)
        Pageable unsorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        // Convert enums to String for native SQL query (avoids PostgreSQL LOWER(bytea) error)
        return ticketRepository.findWithFilters(
                status != null ? status.name() : null,
                category != null ? category.name() : null,
                priority != null ? priority.name() : null,
                resourceId, reportedBy, assignedTo, keyword, unsorted
        ).map(t -> toResponseDTO(t, false));
    }

    public TicketResponseDTO getTicketById(Long id) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));
        return toResponseDTO(ticket, true); // include comments + attachments
    }

    public Page<TicketResponseDTO> getTicketsByResource(Long resourceId, Pageable pageable) {
        return ticketRepository.findByResourceId(resourceId, pageable)
                .map(t -> toResponseDTO(t, false));
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────────

    @Transactional
    public TicketResponseDTO updateTicket(Long id, TicketRequestDTO dto) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));

        ticket.setTitle(dto.getTitle());
        ticket.setDescription(dto.getDescription());
        ticket.setCategory(dto.getCategory());
        ticket.setPriority(dto.getPriority());
        ticket.setLocation(dto.getLocation());
        ticket.setPreferredContact(dto.getPreferredContact());

        return toResponseDTO(ticketRepository.save(ticket), false);
    }

    @Transactional
    public TicketResponseDTO updateTicketStatus(Long id, TicketStatusUpdateDTO dto) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));

        TicketStatus newStatus = dto.getStatus();
        validateStatusTransition(ticket.getStatus(), newStatus);

        // Track SLA timestamps
        if (newStatus == TicketStatus.IN_PROGRESS && ticket.getFirstResponseAt() == null) {
            ticket.setFirstResponseAt(LocalDateTime.now());
        }
        if (newStatus == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
            if (dto.getReason() != null && !dto.getReason().isBlank()) {
                ticket.setResolutionNotes(dto.getReason());
            }
            // Return resource to ACTIVE when ticket is resolved
            updateResourceStatusSafe(ticket.getResourceId(), "ACTIVE");
        }
        if (newStatus == TicketStatus.CLOSED) {
            ticket.setClosedAt(LocalDateTime.now());
            updateResourceStatusSafe(ticket.getResourceId(), "ACTIVE");
        }
        if (newStatus == TicketStatus.REJECTED) {
            if (dto.getReason() == null || dto.getReason().isBlank()) {
                throw new RuntimeException("Rejection reason is required when rejecting a ticket.");
            }
            ticket.setRejectionReason(dto.getReason());
        }

        ticket.setStatus(newStatus);
        return toResponseDTO(ticketRepository.save(ticket), false);
    }

    @Transactional
    public TicketResponseDTO assignTechnician(Long id, TicketAssignDTO dto) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));

        ticket.setAssignedTo(dto.getAssignedTo());

        // Auto-move to IN_PROGRESS when assigned, if still OPEN
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            if (ticket.getFirstResponseAt() == null) {
                ticket.setFirstResponseAt(LocalDateTime.now());
            }
        }

        return toResponseDTO(ticketRepository.save(ticket), false);
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteTicket(Long id) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));
        ticketRepository.delete(ticket);
    }

    // ─── STATS ────────────────────────────────────────────────────────────────────

    public Map<String, Object> getTicketStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        // Status breakdown
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (TicketStatus s : TicketStatus.values()) {
            byStatus.put(s.name(), ticketRepository.countByStatus(s));
        }
        stats.put("byStatus", byStatus);

        // Priority breakdown
        Map<String, Long> byPriority = new LinkedHashMap<>();
        for (TicketPriority p : TicketPriority.values()) {
            byPriority.put(p.name(), ticketRepository.countByPriority(p));
        }
        stats.put("byPriority", byPriority);

        // Category breakdown
        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (TicketCategory c : TicketCategory.values()) {
            byCategory.put(c.name(), ticketRepository.countByCategory(c));
        }
        stats.put("byCategory", byCategory);

        // Technician workload
        List<Object[]> workload = ticketRepository.getTechnicianWorkload();
        Map<String, Long> techWorkload = new LinkedHashMap<>();
        for (Object[] row : workload) {
            techWorkload.put((String) row[0], (Long) row[1]);
        }
        stats.put("technicianWorkload", techWorkload);

        // Totals
        stats.put("totalTickets", ticketRepository.count());
        stats.put("openTickets", ticketRepository.countByStatus(TicketStatus.OPEN));
        stats.put("inProgressTickets", ticketRepository.countByStatus(TicketStatus.IN_PROGRESS));
        stats.put("resolvedTickets", ticketRepository.countByStatus(TicketStatus.RESOLVED));

        return stats;
    }

    // ─── SCHEDULED: AUTO-ESCALATION ──────────────────────────────────────────────

    /**
     * Runs every hour. Escalates OPEN tickets older than 48 hours to CRITICAL priority.
     * This satisfies the "priority escalation" creativity requirement.
     */
    @Scheduled(fixedRate = 3600000) // every hour
    @Transactional
    public void autoEscalateOldTickets() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(48);
        List<IncidentTicket> oldTickets = ticketRepository
                .findByStatusAndEscalatedFalseAndCreatedAtBefore(TicketStatus.OPEN, cutoff);

        for (IncidentTicket ticket : oldTickets) {
            if (ticket.getPriority() != TicketPriority.CRITICAL) {
                ticket.setPriority(TicketPriority.CRITICAL);
            }
            ticket.setEscalated(true);
            ticketRepository.save(ticket);
            System.out.println("AUTO-ESCALATED ticket #" + ticket.getId() + " — open for 48+ hours");
        }
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────────

    private void validateStatusTransition(TicketStatus current, TicketStatus next) {
        // Allowed transitions map
        Map<TicketStatus, Set<TicketStatus>> allowed = new HashMap<>();
        allowed.put(TicketStatus.OPEN, new HashSet<>(Arrays.asList(
                TicketStatus.IN_PROGRESS, TicketStatus.REJECTED, TicketStatus.CLOSED)));
        allowed.put(TicketStatus.IN_PROGRESS, new HashSet<>(Arrays.asList(
                TicketStatus.RESOLVED, TicketStatus.REJECTED)));
        allowed.put(TicketStatus.RESOLVED, new HashSet<>(Arrays.asList(
                TicketStatus.CLOSED, TicketStatus.IN_PROGRESS))); // allow re-open
        allowed.put(TicketStatus.CLOSED, Collections.emptySet());
        allowed.put(TicketStatus.REJECTED, Collections.emptySet());

        Set<TicketStatus> allowedNext = allowed.getOrDefault(current, Collections.emptySet());
        if (!allowedNext.contains(next)) {
            throw new RuntimeException(
                    "Invalid status transition from " + current + " to " + next +
                    ". Allowed: " + allowedNext);
        }
    }

    /**
     * Attempts to update the linked resource's status.
     * Uses a safe no-op if resourceId is null or if Module A's repository is unavailable.
     * When full integration is done, inject ResourceRepository directly.
     */
    private void updateResourceStatusSafe(Long resourceId, String newStatus) {
        if (resourceId == null) return;
        // Integration point for Module A — ResourceRepository can be injected here.
        // For now, this is a no-op placeholder.
        // TODO: inject ResourceRepository and call:
        // resourceRepository.findById(resourceId).ifPresent(r -> {
        //     r.setStatus(ResourceStatus.valueOf(newStatus));
        //     resourceRepository.save(r);
        // });
        System.out.println("Resource #" + resourceId + " status update requested → " + newStatus);
    }

    private TicketResponseDTO toResponseDTO(IncidentTicket ticket, boolean includeNested) {
        TicketResponseDTO dto = new TicketResponseDTO();
        dto.setId(ticket.getId());
        dto.setTitle(ticket.getTitle());
        dto.setDescription(ticket.getDescription());
        dto.setCategory(ticket.getCategory());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getStatus());
        dto.setResourceId(ticket.getResourceId());
        dto.setResourceName(ticket.getResourceName());
        dto.setLocation(ticket.getLocation());
        dto.setReportedBy(ticket.getReportedBy());
        dto.setAssignedTo(ticket.getAssignedTo());
        dto.setResolutionNotes(ticket.getResolutionNotes());
        dto.setRejectionReason(ticket.getRejectionReason());
        dto.setPreferredContact(ticket.getPreferredContact());
        dto.setEscalated(ticket.isEscalated());
        dto.setFirstResponseAt(ticket.getFirstResponseAt());
        dto.setResolvedAt(ticket.getResolvedAt());
        dto.setClosedAt(ticket.getClosedAt());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());

        // Compute hours open for SLA display
        if (ticket.getCreatedAt() != null) {
            LocalDateTime end = ticket.getResolvedAt() != null ? ticket.getResolvedAt() : LocalDateTime.now();
            dto.setHoursOpen(ChronoUnit.HOURS.between(ticket.getCreatedAt(), end));
        }

        if (includeNested) {
            // Comments
            List<CommentResponseDTO> comments = commentRepository
                    .findByTicketIdOrderByCreatedAtAsc(ticket.getId())
                    .stream().map(c -> {
                        CommentResponseDTO cdto = new CommentResponseDTO();
                        cdto.setId(c.getId());
                        cdto.setTicketId(ticket.getId());
                        cdto.setComment(c.getComment());
                        cdto.setCommentedBy(c.getCommentedBy());
                        cdto.setEdited(c.isEdited());
                        cdto.setCreatedAt(c.getCreatedAt());
                        cdto.setUpdatedAt(c.getUpdatedAt());
                        return cdto;
                    }).collect(Collectors.toList());
            dto.setComments(comments);
            dto.setCommentCount(comments.size());

            // Attachments
            List<AttachmentResponseDTO> attachments = attachmentRepository
                    .findByTicketId(ticket.getId())
                    .stream().map(a -> {
                        AttachmentResponseDTO adto = new AttachmentResponseDTO();
                        adto.setId(a.getId());
                        adto.setTicketId(ticket.getId());
                        adto.setFileUrl(a.getFileUrl());
                        adto.setFileName(a.getFileName());
                        adto.setFileSize(a.getFileSize());
                        adto.setContentType(a.getContentType());
                        adto.setUploadedBy(a.getUploadedBy());
                        adto.setUploadedAt(a.getUploadedAt());
                        return adto;
                    }).collect(Collectors.toList());
            dto.setAttachments(attachments);
            dto.setAttachmentCount(attachments.size());
        } else {
            // Counts only for list view
            dto.setAttachmentCount((int) attachmentRepository.countByTicketId(ticket.getId()));
            dto.setCommentCount(commentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).size());
        }

        return dto;
    }
}
