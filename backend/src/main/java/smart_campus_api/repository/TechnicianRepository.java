package smart_campus_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smart_campus_api.entity.Technician;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicianRepository extends JpaRepository<Technician, Long> {

    Optional<Technician> findByEmail(String email);

    List<Technician> findByAvailableTrue();

    // Find technicians who handle a specific category
    // specializations column is a comma-separated string e.g. "ELECTRICAL,HVAC"
    @Query(value = "SELECT * FROM technicians t WHERE " +
           "t.specializations LIKE CONCAT('%', :category, '%') " +
           "ORDER BY t.average_rating DESC, t.active_ticket_count ASC",
           nativeQuery = true)
    List<Technician> findByCategory(@Param("category") String category);

    // Find available technicians by category, ordered by rating desc and workload asc
    @Query(value = "SELECT * FROM technicians t WHERE " +
           "t.is_available = true AND " +
           "t.specializations LIKE CONCAT('%', :category, '%') " +
           "ORDER BY t.average_rating DESC, t.active_ticket_count ASC",
           nativeQuery = true)
    List<Technician> findAvailableByCategory(@Param("category") String category);
}
