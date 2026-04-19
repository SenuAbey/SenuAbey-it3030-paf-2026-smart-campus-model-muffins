package smart_campus_api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import smart_campus_api.dto.AttachmentResponseDTO;
import smart_campus_api.entity.IncidentTicket;
import smart_campus_api.entity.TicketAttachment;
import smart_campus_api.repository.IncidentTicketRepository;
import smart_campus_api.repository.TicketAttachmentRepository;
import smart_campus_api.repository.UserRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TicketAttachmentService {

    private static final int MAX_ATTACHMENTS = 3;
    private static final String UPLOAD_DIR = "./uploads/tickets/";

    @Autowired
    private TicketAttachmentRepository attachmentRepository;

    @Autowired
    private IncidentTicketRepository ticketRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    public AttachmentResponseDTO uploadAttachment(Long ticketId, MultipartFile file, String uploadedBy) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        long existingCount = attachmentRepository.countByTicketId(ticketId);
        if (existingCount >= MAX_ATTACHMENTS) {
            throw new RuntimeException("Maximum of " + MAX_ATTACHMENTS + " attachments allowed per ticket. Current count: " + existingCount);
        }

        // Validate file type — only images allowed for evidence
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new RuntimeException("Only image files (JPEG, PNG, GIF, WebP) and PDFs are allowed as attachments.");
        }

        // Validate file size — max 10MB per file
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new RuntimeException("File size must not exceed 10MB.");
        }

        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename to avoid collisions
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFilename = "ticket_" + ticketId + "_" + UUID.randomUUID() + extension;
            Path filePath = uploadPath.resolve(uniqueFilename);

            // Save file to disk
            Files.copy(file.getInputStream(), filePath);

            // Persist attachment record
            TicketAttachment attachment = new TicketAttachment();
            attachment.setTicket(ticket);
            attachment.setFileName(originalFilename != null ? originalFilename : uniqueFilename);
            attachment.setFileUrl("/uploads/tickets/" + uniqueFilename);
            attachment.setFileSize(file.getSize());
            attachment.setContentType(contentType);
            attachment.setUploadedBy(uploadedBy);

            TicketAttachment saved = attachmentRepository.save(attachment);

            // Only notify admins if the uploader is NOT an admin
            boolean isAdmin = userRepository.findByEmail(uploadedBy)
                    .map(u -> u.getRole().name().equals("ADMIN"))
                    .orElse(false);
            if (!isAdmin) {
                notificationService.notifyAdminsNewAttachment(uploadedBy, ticket.getTitle(), ticketId);
            }

            return toDTO(saved);

        } catch (IOException e) {
            throw new RuntimeException("Failed to store attachment file: " + e.getMessage());
        }
    }

    public List<AttachmentResponseDTO> getAttachmentsByTicket(Long ticketId) {
        // Verify ticket exists
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        return attachmentRepository.findByTicketId(ticketId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public void deleteAttachment(Long ticketId, Long attachmentId, String requestedBy) {
        TicketAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found with id: " + attachmentId));

        if (!attachment.getTicket().getId().equals(ticketId)) {
            throw new RuntimeException("Attachment does not belong to ticket " + ticketId);
        }

        // Only the uploader or admin can delete
        if (!attachment.getUploadedBy().equals(requestedBy) && !requestedBy.equals("admin")) {
            throw new RuntimeException("You do not have permission to delete this attachment.");
        }

        // Delete file from disk
        try {
            String fileUrl = attachment.getFileUrl();
            String filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(UPLOAD_DIR, filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log but don't fail — still remove the DB record
            System.err.println("Warning: could not delete attachment file from disk: " + e.getMessage());
        }

        attachmentRepository.delete(attachment);
    }

    private AttachmentResponseDTO toDTO(TicketAttachment attachment) {
        AttachmentResponseDTO dto = new AttachmentResponseDTO();
        dto.setId(attachment.getId());
        dto.setTicketId(attachment.getTicket().getId());
        dto.setFileUrl(attachment.getFileUrl());
        dto.setFileName(attachment.getFileName());
        dto.setFileSize(attachment.getFileSize());
        dto.setContentType(attachment.getContentType());
        dto.setUploadedBy(attachment.getUploadedBy());
        dto.setUploadedAt(attachment.getUploadedAt());
        return dto;
    }
}
