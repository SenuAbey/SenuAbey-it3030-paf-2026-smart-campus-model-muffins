package smart_campus_api.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import smart_campus_api.dto.*;
import smart_campus_api.entity.IncidentTicket;
import smart_campus_api.enums.TicketCategory;
import smart_campus_api.enums.TicketPriority;
import smart_campus_api.enums.TicketStatus;
import smart_campus_api.repository.IncidentTicketRepository;
import smart_campus_api.repository.TicketAttachmentRepository;
import smart_campus_api.repository.TicketCommentRepository;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TicketService Unit Tests")
class TicketServiceTest {

    @Mock
    private IncidentTicketRepository ticketRepository;

    @Mock
    private TicketAttachmentRepository attachmentRepository;

    @Mock
    private TicketCommentRepository commentRepository;

    @InjectMocks
    private TicketService ticketService;

    private IncidentTicket sampleTicket;
    private TicketRequestDTO sampleRequest;

    @BeforeEach
    void setUp() {
        sampleTicket = new IncidentTicket();
        sampleTicket.setId(1L);
        sampleTicket.setTitle("Projector not working");
        sampleTicket.setDescription("The projector in Lab A-201 is completely dead. No power light.");
        sampleTicket.setCategory(TicketCategory.IT_EQUIPMENT);
        sampleTicket.setPriority(TicketPriority.HIGH);
        sampleTicket.setStatus(TicketStatus.OPEN);
        sampleTicket.setReportedBy("student@sliit.lk");
        sampleTicket.setResourceId(5L);
        sampleTicket.setResourceName("Lab A-201 Projector");
        sampleTicket.setLocation("Block A, Floor 2");
        sampleTicket.setCreatedAt(LocalDateTime.now().minusHours(2));
        sampleTicket.setUpdatedAt(LocalDateTime.now());

        sampleRequest = new TicketRequestDTO();
        sampleRequest.setTitle("Projector not working");
        sampleRequest.setDescription("The projector in Lab A-201 is completely dead. No power light.");
        sampleRequest.setCategory(TicketCategory.IT_EQUIPMENT);
        sampleRequest.setPriority(TicketPriority.HIGH);
        sampleRequest.setReportedBy("student@sliit.lk");
        sampleRequest.setResourceId(5L);
        sampleRequest.setLocation("Block A, Floor 2");
    }

    // ─── CREATE ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createTicket() — should save and return ticket with OPEN status")
    void createTicket_shouldReturnOpenTicket() {
        when(ticketRepository.save(any(IncidentTicket.class))).thenReturn(sampleTicket);
        when(attachmentRepository.countByTicketId(1L)).thenReturn(0L);
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc(1L)).thenReturn(Collections.emptyList());

        TicketResponseDTO result = ticketService.createTicket(sampleRequest);

        assertNotNull(result);
        assertEquals("Projector not working", result.getTitle());
        assertEquals(TicketStatus.OPEN, result.getStatus());
        assertEquals(TicketPriority.HIGH, result.getPriority());
        assertEquals("student@sliit.lk", result.getReportedBy());
        verify(ticketRepository, times(1)).save(any(IncidentTicket.class));
    }

    @Test
    @DisplayName("createTicket() — should default status to OPEN regardless of request")
    void createTicket_shouldAlwaysStartAsOpen() {
        when(ticketRepository.save(any(IncidentTicket.class))).thenAnswer(inv -> {
            IncidentTicket t = inv.getArgument(0);
            t.setId(1L);
            t.setCreatedAt(LocalDateTime.now());
            t.setUpdatedAt(LocalDateTime.now());
            return t;
        });
        when(attachmentRepository.countByTicketId(anyLong())).thenReturn(0L);
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc(anyLong())).thenReturn(Collections.emptyList());

        TicketResponseDTO result = ticketService.createTicket(sampleRequest);

        assertEquals(TicketStatus.OPEN, result.getStatus());
    }

    // ─── READ ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getTicketById() — should return ticket when found")
    void getTicketById_shouldReturnTicket() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));
        when(attachmentRepository.findByTicketId(1L)).thenReturn(Collections.emptyList());
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc(1L)).thenReturn(Collections.emptyList());

        TicketResponseDTO result = ticketService.getTicketById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Projector not working", result.getTitle());
    }

    @Test
    @DisplayName("getTicketById() — should throw RuntimeException when not found")
    void getTicketById_shouldThrowWhenNotFound() {
        when(ticketRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> ticketService.getTicketById(99L));

        assertTrue(ex.getMessage().contains("not found"));
        assertTrue(ex.getMessage().contains("99"));
    }

    @Test
    @DisplayName("getAllTickets() — should return paged results")
    void getAllTickets_shouldReturnPagedResults() {
        Page<IncidentTicket> page = new PageImpl<>(List.of(sampleTicket));
        when(ticketRepository.findWithFilters(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(page);
        when(attachmentRepository.countByTicketId(anyLong())).thenReturn(0L);
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc(anyLong())).thenReturn(Collections.emptyList());

        Page<TicketResponseDTO> result = ticketService.getAllTickets(
                null, null, null, null, null, null, null,
                PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Projector not working", result.getContent().get(0).getTitle());
    }

    // ─── STATUS UPDATE ───────────────────────────────────────────────────────

    @Test
    @DisplayName("updateTicketStatus() — OPEN to IN_PROGRESS should set firstResponseAt")
    void updateStatus_openToInProgress_shouldSetFirstResponseAt() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));
        when(ticketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attachmentRepository.countByTicketId(anyLong())).thenReturn(0L);
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc(anyLong())).thenReturn(Collections.emptyList());

        TicketStatusUpdateDTO dto = new TicketStatusUpdateDTO();
        dto.setStatus(TicketStatus.IN_PROGRESS);

        TicketResponseDTO result = ticketService.updateTicketStatus(1L, dto);

        assertEquals(TicketStatus.IN_PROGRESS, result.getStatus());
        assertNotNull(sampleTicket.getFirstResponseAt());
    }

    @Test
    @DisplayName("updateTicketStatus() — IN_PROGRESS to RESOLVED should set resolvedAt and store notes")
    void updateStatus_inProgressToResolved_shouldSetResolvedAt() {
        sampleTicket.setStatus(TicketStatus.IN_PROGRESS);
        sampleTicket.setFirstResponseAt(LocalDateTime.now().minusHours(1));

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));
        when(ticketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attachmentRepository.countByTicketId(anyLong())).thenReturn(0L);
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc(anyLong())).thenReturn(Collections.emptyList());

        TicketStatusUpdateDTO dto = new TicketStatusUpdateDTO();
        dto.setStatus(TicketStatus.RESOLVED);
        dto.setReason("Replaced projector lamp. Tested and confirmed working.");

        TicketResponseDTO result = ticketService.updateTicketStatus(1L, dto);

        assertEquals(TicketStatus.RESOLVED, result.getStatus());
        assertNotNull(sampleTicket.getResolvedAt());
        assertEquals("Replaced projector lamp. Tested and confirmed working.",
                sampleTicket.getResolutionNotes());
    }

    @Test
    @DisplayName("updateTicketStatus() — REJECTED without reason should throw exception")
    void updateStatus_rejectedWithoutReason_shouldThrow() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));

        TicketStatusUpdateDTO dto = new TicketStatusUpdateDTO();
        dto.setStatus(TicketStatus.REJECTED);
        dto.setReason(""); // empty reason

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> ticketService.updateTicketStatus(1L, dto));

        assertTrue(ex.getMessage().toLowerCase().contains("reason"));
    }

    @Test
    @DisplayName("updateTicketStatus() — invalid transition CLOSED to OPEN should throw")
    void updateStatus_invalidTransition_shouldThrow() {
        sampleTicket.setStatus(TicketStatus.CLOSED);
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));

        TicketStatusUpdateDTO dto = new TicketStatusUpdateDTO();
        dto.setStatus(TicketStatus.OPEN);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> ticketService.updateTicketStatus(1L, dto));

        assertTrue(ex.getMessage().contains("Invalid status transition"));
    }

    @Test
    @DisplayName("updateTicketStatus() — invalid transition REJECTED to IN_PROGRESS should throw")
    void updateStatus_fromRejected_shouldThrow() {
        sampleTicket.setStatus(TicketStatus.REJECTED);
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));

        TicketStatusUpdateDTO dto = new TicketStatusUpdateDTO();
        dto.setStatus(TicketStatus.IN_PROGRESS);

        assertThrows(RuntimeException.class,
                () -> ticketService.updateTicketStatus(1L, dto));
    }

    // ─── ASSIGN ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("assignTechnician() — should set assignedTo and auto-move to IN_PROGRESS if OPEN")
    void assignTechnician_shouldSetAssigneeAndMoveToInProgress() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));
        when(ticketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attachmentRepository.countByTicketId(anyLong())).thenReturn(0L);
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc(anyLong())).thenReturn(Collections.emptyList());

        TicketAssignDTO dto = new TicketAssignDTO();
        dto.setAssignedTo("tech@sliit.lk");

        TicketResponseDTO result = ticketService.assignTechnician(1L, dto);

        assertEquals("tech@sliit.lk", result.getAssignedTo());
        assertEquals(TicketStatus.IN_PROGRESS, result.getStatus());
        assertNotNull(sampleTicket.getFirstResponseAt());
    }

    @Test
    @DisplayName("assignTechnician() — should not change status if already IN_PROGRESS")
    void assignTechnician_shouldNotDowngradeStatus() {
        sampleTicket.setStatus(TicketStatus.IN_PROGRESS);
        sampleTicket.setFirstResponseAt(LocalDateTime.now().minusHours(1));

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));
        when(ticketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attachmentRepository.countByTicketId(anyLong())).thenReturn(0L);
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc(anyLong())).thenReturn(Collections.emptyList());

        TicketAssignDTO dto = new TicketAssignDTO();
        dto.setAssignedTo("tech2@sliit.lk");

        TicketResponseDTO result = ticketService.assignTechnician(1L, dto);

        assertEquals(TicketStatus.IN_PROGRESS, result.getStatus());
        assertEquals("tech2@sliit.lk", result.getAssignedTo());
    }

    // ─── DELETE ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteTicket() — should call repository delete")
    void deleteTicket_shouldCallDelete() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));

        ticketService.deleteTicket(1L);

        verify(ticketRepository, times(1)).delete(sampleTicket);
    }

    @Test
    @DisplayName("deleteTicket() — should throw when ticket not found")
    void deleteTicket_shouldThrowWhenNotFound() {
        when(ticketRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> ticketService.deleteTicket(999L));
    }

    // ─── UPDATE ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateTicket() — should update fields correctly")
    void updateTicket_shouldUpdateFields() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));
        when(ticketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attachmentRepository.countByTicketId(anyLong())).thenReturn(0L);
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc(anyLong())).thenReturn(Collections.emptyList());

        sampleRequest.setTitle("Updated title — power outlet also broken");
        sampleRequest.setPriority(TicketPriority.CRITICAL);

        TicketResponseDTO result = ticketService.updateTicket(1L, sampleRequest);

        assertEquals("Updated title — power outlet also broken", result.getTitle());
        assertEquals(TicketPriority.CRITICAL, result.getPriority());
    }

    // ─── SLA / HOURS OPEN ────────────────────────────────────────────────────

    @Test
    @DisplayName("getTicketById() — hoursOpen should be computed correctly")
    void getTicketById_hoursOpenShouldBeComputed() {
        sampleTicket.setCreatedAt(LocalDateTime.now().minusHours(5));

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));
        when(attachmentRepository.findByTicketId(1L)).thenReturn(Collections.emptyList());
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc(1L)).thenReturn(Collections.emptyList());

        TicketResponseDTO result = ticketService.getTicketById(1L);

        assertNotNull(result.getHoursOpen());
        assertTrue(result.getHoursOpen() >= 4); // at least 4h since created 5h ago
    }

    // ─── STATS ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getTicketStats() — should return map with all keys")
    void getTicketStats_shouldReturnAllKeys() {
        when(ticketRepository.count()).thenReturn(10L);
        when(ticketRepository.countByStatus(any())).thenReturn(2L);
        when(ticketRepository.countByPriority(any())).thenReturn(3L);
        when(ticketRepository.countByCategory(any())).thenReturn(1L);
        when(ticketRepository.getTechnicianWorkload()).thenReturn(Collections.emptyList());

        var stats = ticketService.getTicketStats();

        assertTrue(stats.containsKey("byStatus"));
        assertTrue(stats.containsKey("byPriority"));
        assertTrue(stats.containsKey("byCategory"));
        assertTrue(stats.containsKey("technicianWorkload"));
        assertTrue(stats.containsKey("totalTickets"));
        assertEquals(10L, stats.get("totalTickets"));
    }
}
