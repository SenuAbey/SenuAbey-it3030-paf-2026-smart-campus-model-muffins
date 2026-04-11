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

    @Query("SELECT t FROM IncidentTicket t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:category IS NULL OR t.category = :category) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:resourceId IS NULL OR t.resourceId = :resourceId) AND " +
           "(:reportedBy IS NULL OR t.reportedBy = :reportedBy) AND " +
           "(:assignedTo IS NULL OR t.assignedTo = :assignedTo) AND " +
           "(:keyword IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<IncidentTicket> findWithFilters(
            @Param("status") TicketStatus status,
            @Param("category") TicketCategory category,
            @Param("priority") TicketPriority priority,
            @Param("resourceId") Long resourceId,
            @Param("reportedBy") String reportedBy,
            @Param("assignedTo") String assignedTo,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // For auto-escalation: find OPEN tickets older than 48 hours not yet escalated
    List<IncidentTicket> findByStatusAndEscalatedFalseAndCreatedAtBefore(
            TicketStatus status, LocalDateTime cutoff);

    // Stats queries
    long countByStatus(TicketStatus status);

    long countByPriority(TicketPriority priority);

    long countByCategory(TicketCategory category);

    @Query("SELECT COUNT(t) FROM IncidentTicket t WHERE t.assignedTo = :assignedTo AND t.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')")
    long countActiveTicketsByTechnician(@Param("assignedTo") String assignedTo);

    @Query("SELECT t.assignedTo, COUNT(t) FROM IncidentTicket t WHERE t.assignedTo IS NOT NULL AND t.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED') GROUP BY t.assignedTo")
    List<Object[]> getTechnicianWorkload();
}
