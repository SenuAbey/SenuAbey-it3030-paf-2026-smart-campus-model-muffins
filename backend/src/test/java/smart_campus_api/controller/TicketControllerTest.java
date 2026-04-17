package smart_campus_api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import smart_campus_api.dto.*;
import smart_campus_api.enums.TicketCategory;
import smart_campus_api.enums.TicketPriority;
import smart_campus_api.enums.TicketStatus;
import smart_campus_api.service.TicketAttachmentService;
import smart_campus_api.service.TicketCommentService;
import smart_campus_api.service.TicketService;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TicketController.class)
@DisplayName("TicketController Integration Tests")
class TicketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TicketService ticketService;

    @MockBean
    private TicketAttachmentService attachmentService;

    @MockBean
    private TicketCommentService commentService;

    private TicketResponseDTO sampleResponse;
    private TicketRequestDTO sampleRequest;

    @BeforeEach
    void setUp() {
        sampleResponse = new TicketResponseDTO();
        sampleResponse.setId(1L);
        sampleResponse.setTitle("Broken AC Unit");
        sampleResponse.setDescription("AC in Meeting Room B-104 is leaking water.");
        sampleResponse.setCategory(TicketCategory.HVAC);
        sampleResponse.setPriority(TicketPriority.HIGH);
        sampleResponse.setStatus(TicketStatus.OPEN);
        sampleResponse.setReportedBy("staff@sliit.lk");
        sampleResponse.setCreatedAt(LocalDateTime.now());
        sampleResponse.setUpdatedAt(LocalDateTime.now());
        sampleResponse.setAttachmentCount(0);
        sampleResponse.setCommentCount(0);

        sampleRequest = new TicketRequestDTO();
        sampleRequest.setTitle("Broken AC Unit");
        sampleRequest.setDescription("AC in Meeting Room B-104 is leaking water.");
        sampleRequest.setCategory(TicketCategory.HVAC);
        sampleRequest.setPriority(TicketPriority.HIGH);
        sampleRequest.setReportedBy("staff@sliit.lk");
    }

    // ─── GET /api/v1/tickets ─────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/tickets — returns 200 with paged list")
    void getAllTickets_returns200() throws Exception {
        when(ticketService.getAllTickets(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(sampleResponse)));

        mockMvc.perform(get("/api/v1/tickets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Broken AC Unit"))
                .andExpect(jsonPath("$.content[0].status").value("OPEN"));
    }

    @Test
    @DisplayName("GET /api/v1/tickets — supports status filter query param")
    void getAllTickets_withStatusFilter() throws Exception {
        when(ticketService.getAllTickets(eq(TicketStatus.OPEN), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(sampleResponse)));

        mockMvc.perform(get("/api/v1/tickets").param("status", "OPEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("OPEN"));
    }

    @Test
    @DisplayName("GET /api/v1/tickets — returns 200 with empty list when no tickets")
    void getAllTickets_empty_returns200() throws Exception {
        when(ticketService.getAllTickets(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/v1/tickets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    // ─── GET /api/v1/tickets/{id} ────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/tickets/{id} — returns 200 with ticket")
    void getTicketById_returns200() throws Exception {
        when(ticketService.getTicketById(1L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/tickets/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Broken AC Unit"))
                .andExpect(jsonPath("$.category").value("HVAC"));
    }

    @Test
    @DisplayName("GET /api/v1/tickets/{id} — returns 400/404 when not found")
    void getTicketById_notFound_returns4xx() throws Exception {
        when(ticketService.getTicketById(999L))
                .thenThrow(new RuntimeException("Ticket not found with id: 999"));

        mockMvc.perform(get("/api/v1/tickets/999"))
                .andExpect(status().is4xxClientError());
    }

    // ─── POST /api/v1/tickets ────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/v1/tickets — returns 201 Created with new ticket")
    void createTicket_returns201() throws Exception {
        when(ticketService.createTicket(any())).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    @DisplayName("POST /api/v1/tickets — returns 400 when title is blank")
    void createTicket_blankTitle_returns400() throws Exception {
        sampleRequest.setTitle(""); // blank title should fail validation

        mockMvc.perform(post("/api/v1/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/tickets — returns 400 when description is missing")
    void createTicket_missingDescription_returns400() throws Exception {
        sampleRequest.setDescription(null);

        mockMvc.perform(post("/api/v1/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/tickets — returns 400 when category is missing")
    void createTicket_missingCategory_returns400() throws Exception {
        sampleRequest.setCategory(null);

        mockMvc.perform(post("/api/v1/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isBadRequest());
    }

    // ─── PUT /api/v1/tickets/{id} ────────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/v1/tickets/{id} — returns 200 with updated ticket")
    void updateTicket_returns200() throws Exception {
        sampleResponse.setTitle("Updated: AC leaking and mold forming");
        when(ticketService.updateTicket(eq(1L), any())).thenReturn(sampleResponse);

        sampleRequest.setTitle("Updated: AC leaking and mold forming");

        mockMvc.perform(put("/api/v1/tickets/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated: AC leaking and mold forming"));
    }

    // ─── DELETE /api/v1/tickets/{id} ─────────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/v1/tickets/{id} — returns 200 with success message")
    void deleteTicket_returns200() throws Exception {
        doNothing().when(ticketService).deleteTicket(1L);

        mockMvc.perform(delete("/api/v1/tickets/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Ticket #1 deleted successfully."));
    }

    // ─── PATCH /api/v1/tickets/{id}/status ───────────────────────────────────

    @Test
    @DisplayName("PATCH /api/v1/tickets/{id}/status — returns 200 with updated status")
    void updateStatus_returns200() throws Exception {
        sampleResponse.setStatus(TicketStatus.IN_PROGRESS);
        when(ticketService.updateTicketStatus(eq(1L), any())).thenReturn(sampleResponse);

        TicketStatusUpdateDTO dto = new TicketStatusUpdateDTO();
        dto.setStatus(TicketStatus.IN_PROGRESS);

        mockMvc.perform(patch("/api/v1/tickets/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("PATCH /api/v1/tickets/{id}/status — returns 400 when status is null")
    void updateStatus_nullStatus_returns400() throws Exception {
        mockMvc.perform(patch("/api/v1/tickets/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": null}"))
                .andExpect(status().isBadRequest());
    }

    // ─── PATCH /api/v1/tickets/{id}/assign ──────────────────────────────────

    @Test
    @DisplayName("PATCH /api/v1/tickets/{id}/assign — returns 200 with assigned ticket")
    void assignTechnician_returns200() throws Exception {
        sampleResponse.setAssignedTo("tech@sliit.lk");
        sampleResponse.setStatus(TicketStatus.IN_PROGRESS);
        when(ticketService.assignTechnician(eq(1L), any())).thenReturn(sampleResponse);

        TicketAssignDTO dto = new TicketAssignDTO();
        dto.setAssignedTo("tech@sliit.lk");

        mockMvc.perform(patch("/api/v1/tickets/1/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo").value("tech@sliit.lk"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    // ─── GET /api/v1/tickets/stats ───────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/tickets/stats — returns 200 with stats map")
    void getStats_returns200() throws Exception {
        when(ticketService.getTicketStats()).thenReturn(Map.of(
                "totalTickets", 10L,
                "openTickets", 3L,
                "byStatus", Map.of("OPEN", 3L, "RESOLVED", 7L)
        ));

        mockMvc.perform(get("/api/v1/tickets/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTickets").value(10))
                .andExpect(jsonPath("$.openTickets").value(3));
    }

    // ─── POST /api/v1/tickets/{id}/comments ──────────────────────────────────

    @Test
    @DisplayName("POST /api/v1/tickets/{id}/comments — returns 201 Created")
    void addComment_returns201() throws Exception {
        CommentResponseDTO commentDTO = new CommentResponseDTO();
        commentDTO.setId(1L);
        commentDTO.setTicketId(1L);
        commentDTO.setComment("Checked the unit — needs a new compressor.");
        commentDTO.setCommentedBy("tech@sliit.lk");
        commentDTO.setEdited(false);
        commentDTO.setCreatedAt(LocalDateTime.now());

        when(commentService.addComment(eq(1L), any())).thenReturn(commentDTO);

        CommentRequestDTO req = new CommentRequestDTO();
        req.setComment("Checked the unit — needs a new compressor.");
        req.setCommentedBy("tech@sliit.lk");

        mockMvc.perform(post("/api/v1/tickets/1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.comment").value("Checked the unit — needs a new compressor."))
                .andExpect(jsonPath("$.commentedBy").value("tech@sliit.lk"));
    }

    // ─── GET /api/v1/tickets/{id}/comments ───────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/tickets/{id}/comments — returns 200 list")
    void getComments_returns200() throws Exception {
        CommentResponseDTO commentDTO = new CommentResponseDTO();
        commentDTO.setId(1L);
        commentDTO.setTicketId(1L);
        commentDTO.setComment("Will inspect tomorrow morning.");
        commentDTO.setCommentedBy("tech@sliit.lk");
        commentDTO.setCreatedAt(LocalDateTime.now());

        when(commentService.getCommentsByTicket(1L)).thenReturn(List.of(commentDTO));

        mockMvc.perform(get("/api/v1/tickets/1/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].comment").value("Will inspect tomorrow morning."));
    }
}
