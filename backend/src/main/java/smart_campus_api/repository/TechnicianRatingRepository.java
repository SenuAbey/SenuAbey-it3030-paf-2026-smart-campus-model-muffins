package smart_campus_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smart_campus_api.entity.TechnicianRating;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicianRatingRepository extends JpaRepository<TechnicianRating, Long> {

    List<TechnicianRating> findByTechnicianIdOrderByCreatedAtDesc(Long technicianId);

    Optional<TechnicianRating> findByTechnicianIdAndTicketId(Long technicianId, Long ticketId);

    boolean existsByTechnicianIdAndTicketId(Long technicianId, Long ticketId);
}
