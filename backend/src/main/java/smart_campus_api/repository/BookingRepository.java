package smart_campus_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import smart_campus_api.entity.Booking;
import smart_campus_api.enums.BookingStatus;
import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByBookedBy(String bookedBy);

    List<Booking> findByStatus(BookingStatus status);

    // Conflict check query — checks overlapping bookings for same resource
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
            "AND b.status IN ('PENDING', 'APPROVED') " +
            "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(
            @Param("resourceId") String resourceId,  // ← change Long to String
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}