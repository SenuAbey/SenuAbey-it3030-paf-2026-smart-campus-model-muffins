package smart_campus_api.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import smart_campus_api.dto.AttachmentResponseDTO;
import smart_campus_api.entity.IncidentTicket;
import smart_campus_api.entity.TicketAttachment;
import smart_campus_api.enums.TicketCategory;
import smart_campus_api.enums.TicketPriority;
import smart_campus_api.enums.TicketStatus;
import smart_campus_api.repository.IncidentTicketRepository;
import smart_campus_api.repository.TicketAttachmentRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TicketAttachmentService Unit Tests")
class TicketAttachmentServiceTest {

    @Mock
    private TicketAttachmentRepository attachmentRepository;

    @Mock
    private IncidentTicketRepository ticketRepository;

    @InjectMocks
    private TicketAttachmentService attachmentService;

    private IncidentTicket ticket;

    @BeforeEach
    void setUp() {
        ticket = new IncidentTicket();
        ticket.setId(1L);
        ticket.setTitle("Broken AC Unit");
        ticket.setDescription("The AC in Meeting Room B-104 is leaking water.");
        ticket.setCategory(TicketCategory.HVAC);
        ticket.setPriority(TicketPriority.HIGH);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setReportedBy("staff@sliit.lk");
    }

    // ─── UPLOAD ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("uploadAttachment() — should reject when ticket already has 3 attachments")
    void upload_shouldRejectWhenMaxReached() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(attachmentRepository.countByTicketId(1L)).thenReturn(3L); // already at max

        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.jpg", "image/jpeg", new byte[1024]);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> attachmentService.uploadAttachment(1L, file, "staff@sliit.lk"));

        assertTrue(ex.getMessage().contains("Maximum"));
        assertTrue(ex.getMessage().contains("3"));
    }

    @Test
    @DisplayName("uploadAttachment() — should reject non-image, non-PDF files")
    void upload_shouldRejectInvalidFileType() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(attachmentRepository.countByTicketId(1L)).thenReturn(0L);

        MockMultipartFile file = new MockMultipartFile(
                "file", "malware.exe", "application/x-msdownload", new byte[1024]);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> attachmentService.uploadAttachment(1L, file, "staff@sliit.lk"));

        assertTrue(ex.getMessage().toLowerCase().contains("image") ||
                   ex.getMessage().toLowerCase().contains("allowed"));
    }

    @Test
    @DisplayName("uploadAttachment() — should reject files over 10MB")
    void upload_shouldRejectOversizedFile() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(attachmentRepository.countByTicketId(1L)).thenReturn(0L);

        // 11MB file
        byte[] bigContent = new byte[11 * 1024 * 1024];
        MockMultipartFile file = new MockMultipartFile(
                "file", "huge.jpg", "image/jpeg", bigContent);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> attachmentService.uploadAttachment(1L, file, "staff@sliit.lk"));

        assertTrue(ex.getMessage().contains("10MB"));
    }

    @Test
    @DisplayName("uploadAttachment() — should throw when ticket not found")
    void upload_shouldThrowWhenTicketNotFound() {
        when(ticketRepository.findById(99L)).thenReturn(Optional.empty());

        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.jpg", "image/jpeg", new byte[1024]);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> attachmentService.uploadAttachment(99L, file, "staff@sliit.lk"));

        assertTrue(ex.getMessage().contains("not found"));
    }

    // ─── GET ATTACHMENTS ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getAttachmentsByTicket() — should return list of DTOs")
    void getAttachments_shouldReturnDTOs() {
        TicketAttachment att = new TicketAttachment();
        att.setId(1L);
        att.setTicket(ticket);
        att.setFileName("evidence.jpg");
        att.setFileUrl("/uploads/tickets/ticket_1_abc.jpg");
        att.setFileSize(204800L);
        att.setContentType("image/jpeg");
        att.setUploadedBy("staff@sliit.lk");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(attachmentRepository.findByTicketId(1L)).thenReturn(List.of(att));

        List<AttachmentResponseDTO> results = attachmentService.getAttachmentsByTicket(1L);

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("evidence.jpg", results.get(0).getFileName());
        assertEquals("image/jpeg", results.get(0).getContentType());
    }

    // ─── DELETE ATTACHMENT ───────────────────────────────────────────────────

    @Test
    @DisplayName("deleteAttachment() — non-owner cannot delete")
    void deleteAttachment_otherUserCannotDelete() {
        TicketAttachment att = new TicketAttachment();
        att.setId(5L);
        att.setTicket(ticket);
        att.setFileName("photo.jpg");
        att.setFileUrl("/uploads/tickets/photo.jpg");
        att.setUploadedBy("staff@sliit.lk");

        when(attachmentRepository.findById(5L)).thenReturn(Optional.of(att));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> attachmentService.deleteAttachment(1L, 5L, "intruder@sliit.lk"));

        assertTrue(ex.getMessage().toLowerCase().contains("permission"));
        verify(attachmentRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteAttachment() — admin can delete any attachment")
    void deleteAttachment_adminCanDelete() {
        TicketAttachment att = new TicketAttachment();
        att.setId(5L);
        att.setTicket(ticket);
        att.setFileName("photo.jpg");
        att.setFileUrl("/uploads/tickets/photo.jpg");
        att.setUploadedBy("staff@sliit.lk");

        when(attachmentRepository.findById(5L)).thenReturn(Optional.of(att));

        // Should not throw — admin bypasses ownership check
        assertDoesNotThrow(() -> attachmentService.deleteAttachment(1L, 5L, "admin"));
        verify(attachmentRepository, times(1)).delete(att);
    }

    @Test
    @DisplayName("deleteAttachment() — should throw when attachment belongs to different ticket")
    void deleteAttachment_wrongTicket_shouldThrow() {
        IncidentTicket otherTicket = new IncidentTicket();
        otherTicket.setId(99L);

        TicketAttachment att = new TicketAttachment();
        att.setId(5L);
        att.setTicket(otherTicket); // belongs to ticket 99, not 1
        att.setFileUrl("/uploads/tickets/photo.jpg");
        att.setUploadedBy("staff@sliit.lk");

        when(attachmentRepository.findById(5L)).thenReturn(Optional.of(att));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> attachmentService.deleteAttachment(1L, 5L, "staff@sliit.lk"));

        assertTrue(ex.getMessage().contains("does not belong"));
    }
}
