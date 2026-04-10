package smart_campus_api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smart_campus_api.dto.BookingRequestDTO;
import smart_campus_api.dto.BookingResponseDTO;
import smart_campus_api.entity.Booking;
import smart_campus_api.entity.Resource;
import smart_campus_api.enums.BookingStatus;
import smart_campus_api.enums.ResourceStatus;
import smart_campus_api.repository.BookingRepository;
import smart_campus_api.repository.ResourceRepository;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    public BookingResponseDTO createBooking(BookingRequestDTO dto) {
        // 1. Find the resource
        Resource resource = resourceRepository.findById(dto.getResourceId())
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        // 2. Check resource is ACTIVE
        if (!resource.getStatus().equals(ResourceStatus.ACTIVE)) {
            throw new RuntimeException("Resource is not available for booking");
        }

        // 3. Check for scheduling conflicts
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                dto.getResourceId(), dto.getStartTime(), dto.getEndTime()
        );
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("This resource is already booked for the selected time slot");
        }

        // 4. Create and save booking
        Booking booking = new Booking();
        booking.setResource(resource);
        booking.setBookedBy(dto.getBookedBy());
        booking.setStartTime(dto.getStartTime());
        booking.setEndTime(dto.getEndTime());
        booking.setPurpose(dto.getPurpose());
        booking.setAttendees(dto.getAttendees());
        booking.setStatus(BookingStatus.PENDING);

        return toDTO(bookingRepository.save(booking));
    }

    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<BookingResponseDTO> getMyBookings(String email) {
        return bookingRepository.findByBookedBy(email).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public BookingResponseDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return toDTO(booking);
    }

    public BookingResponseDTO approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(BookingStatus.APPROVED);
        return toDTO(bookingRepository.save(booking));
    }

    public BookingResponseDTO rejectBooking(Long id, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        return toDTO(bookingRepository.save(booking));
    }

    public BookingResponseDTO cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(BookingStatus.CANCELLED);
        return toDTO(bookingRepository.save(booking));
    }

    public void deleteBooking(Long id) {
        bookingRepository.deleteById(id);
    }

    private BookingResponseDTO toDTO(Booking b) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId(b.getId());
        dto.setResourceId(b.getResource().getId());
        dto.setResourceName(b.getResource().getName());
        dto.setBookedBy(b.getBookedBy());
        dto.setStartTime(b.getStartTime());
        dto.setEndTime(b.getEndTime());
        dto.setPurpose(b.getPurpose());
        dto.setAttendees(b.getAttendees());
        dto.setStatus(b.getStatus());
        dto.setRejectionReason(b.getRejectionReason());
        dto.setCreatedAt(b.getCreatedAt());
        return dto;
    }
}