package smart_campus_api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smart_campus_api.dto.BookingRequestDTO;
import smart_campus_api.dto.BookingResponseDTO;
import smart_campus_api.service.BookingService;
import org.springframework.http.MediaType;
import smart_campus_api.service.QRCodeService;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.Map;
import java.util.HashMap;



/**
 * Booking endpoints.
 *
 * NOTE: @CrossOrigin is intentionally removed here.
 * CORS is handled globally in SecurityConfig.corsConfigurationSource()
 * and WebConfig.addCorsMappings(), which already allow localhost:5173/5174.
 * Adding @CrossOrigin on top of Spring Security's CORS filter causes conflicts.
 */
@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private QRCodeService qrCodeService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(@RequestBody BookingRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(dto));
    }

    @GetMapping
    public ResponseEntity<List<BookingResponseDTO>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings(@RequestParam String email) {
        return ResponseEntity.ok(bookingService.getMyBookings(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDTO> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<BookingResponseDTO> approveBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<BookingResponseDTO> rejectBooking(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, body.get("reason")));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/qr-code")
    public ResponseEntity<?> getQRCode(@PathVariable Long id) {
        try {
            System.out.println("=== QR CODE REQUEST ===");
            System.out.println("Booking ID: " + id);

            BookingResponseDTO booking = bookingService.getBookingById(id);
            System.out.println("Booking found: " + (booking != null));
            System.out.println("Booking Status: " + booking.getStatus());

            if (!"APPROVED".equals(booking.getStatus().name())) {
                System.out.println("ERROR: Booking not approved");
                return ResponseEntity.badRequest().body("Booking not approved");
            }

            String checkInUrl = frontendUrl + "/checkin?bookingId=" + id;
            System.out.println("Check-in URL: " + checkInUrl);

            byte[] qrCode = qrCodeService.generateQRCode(checkInUrl, 300, 300);
            System.out.println("QR Code generated, size: " + qrCode.length);

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(qrCode);

        } catch (Exception e) {
            System.err.println("=== QR CODE ERROR ===");
            System.err.println("Error type: " + e.getClass().getName());
            System.err.println("Error message: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/checkin")
    public ResponseEntity<Map<String, String>> checkIn(@PathVariable Long id) {
        BookingResponseDTO booking = bookingService.getBookingById(id);

        // Check if booking is approved and not already checked in
        if (!"APPROVED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only approved bookings can be checked in"));
        }

        if (booking.isCheckedIn()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking already checked in"));
        }

        bookingService.checkIn(id);

        return ResponseEntity.ok(Map.of("message", "Check-in successful!", "bookingId", String.valueOf(id)));
    }

    @GetMapping("/{id}/checkin-status")
    public ResponseEntity<Map<String, Object>> getCheckInStatus(@PathVariable Long id) {
        BookingResponseDTO booking = bookingService.getBookingById(id);
        Map<String, Object> status = new HashMap<>();
        status.put("checkedIn", booking.isCheckedIn());
        status.put("checkedInAt", booking.getCheckedInAt());
        status.put("status", booking.getStatus());
        return ResponseEntity.ok(status);
    }
}
