package smart_campus_api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smart_campus_api.entity.IncidentTicket;
import smart_campus_api.enums.TicketCategory;
import smart_campus_api.enums.TicketPriority;
import smart_campus_api.enums.TicketStatus;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IncidentTicketRepository extends JpaRepository<IncidentTicket, Long> {

    Page<IncidentTicket> findByStatus(TicketStatus status, Pageable pageable);
    Page<IncidentTicket> findByCategory(TicketCategory category, Pageable pageable);
    Page<IncidentTicket> findByPriority(TicketPriority priority, Pageable pageable);
    Page<IncidentTicket> findByResourceId(Long resourceId, Pageable pageable);
    Page<IncidentTicket> findByReportedBy(String reportedBy, Pageable pageable);
    Page<IncidentTicket> findByAssignedTo(String assignedTo, Pageable pageable);

    // FIX: No ORDER BY in native query — sorting handled in service via unsorted Pageable.
    // This avoids Spring appending "t.createdAt desc" (camelCase) which PostgreSQL rejects.
    @Query(value = "SELECT * FROM incident_tickets t WHERE " +
           "(:status IS NULL OR t.status = CAST(:status AS VARCHAR)) AND " +
           "(:category IS NULL OR t.category = CAST(:category AS VARCHAR)) AND " +
           "(:priority IS NULL OR t.priority = CAST(:priority AS VARCHAR)) AND " +
           "(:resourceId IS NULL OR t.resource_id = :resourceId) AND " +
           "(:reportedBy IS NULL OR t.reported_by = :reportedBy) AND " +
           "(:assignedTo IS NULL OR t.assigned_to = :assignedTo) AND " +
           "(:keyword IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "   OR LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')))",
           countQuery = "SELECT COUNT(*) FROM incident_tickets t WHERE " +
           "(:status IS NULL OR t.status = CAST(:status AS VARCHAR)) AND " +
           "(:category IS NULL OR t.category = CAST(:category AS VARCHAR)) AND " +
           "(:priority IS NULL OR t.priority = CAST(:priority AS VARCHAR)) AND " +
           "(:resourceId IS NULL OR t.resource_id = :resourceId) AND " +
           "(:reportedBy IS NULL OR t.reported_by = :reportedBy) AND " +
           "(:assignedTo IS NULL OR t.assigned_to = :assignedTo) AND " +
           "(:keyword IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "   OR LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')))",
           nativeQuery = true)
    Page<IncidentTicket> findWithFilters(
            @Param("status") String status,
            @Param("category") String category,
            @Param("priority") String priority,
            @Param("resourceId") Long resourceId,
            @Param("reportedBy") String reportedBy,
            @Param("assignedTo") String assignedTo,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // Auto-escalation
    List<IncidentTicket> findByStatusAndEscalatedFalseAndCreatedAtBefore(
            TicketStatus status, LocalDateTime cutoff);

    // Stats
    long countByStatus(TicketStatus status);
    long countByPriority(TicketPriority priority);
    long countByCategory(TicketCategory category);

    @Query("SELECT COUNT(t) FROM IncidentTicket t WHERE t.assignedTo = :assignedTo " +
           "AND t.status <> smart_campus_api.enums.TicketStatus.RESOLVED " +
           "AND t.status <> smart_campus_api.enums.TicketStatus.CLOSED " +
           "AND t.status <> smart_campus_api.enums.TicketStatus.REJECTED")
    long countActiveTicketsByTechnician(@Param("assignedTo") String assignedTo);

    @Query("SELECT t.assignedTo, COUNT(t) FROM IncidentTicket t " +
           "WHERE t.assignedTo IS NOT NULL " +
           "AND t.status <> smart_campus_api.enums.TicketStatus.RESOLVED " +
           "AND t.status <> smart_campus_api.enums.TicketStatus.CLOSED " +
           "AND t.status <> smart_campus_api.enums.TicketStatus.REJECTED " +
           "GROUP BY t.assignedTo")
    List<Object[]> getTechnicianWorkload();
}
