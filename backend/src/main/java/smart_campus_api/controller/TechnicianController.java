package smart_campus_api.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smart_campus_api.dto.RatingRequestDTO;
import smart_campus_api.dto.TechnicianRequestDTO;
import smart_campus_api.dto.TechnicianResponseDTO;
import smart_campus_api.entity.TechnicianRating;
import smart_campus_api.service.TechnicianService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/technicians")
@CrossOrigin(origins = "http://localhost:5173")
public class TechnicianController {

    @Autowired private TechnicianService technicianService;

    /** GET /api/v1/technicians — all technicians */
    @GetMapping
    public ResponseEntity<List<TechnicianResponseDTO>> getAllTechnicians() {
        return ResponseEntity.ok(technicianService.getAllTechnicians());
    }

    /** GET /api/v1/technicians/{id} — single technician */
    @GetMapping("/{id}")
    public ResponseEntity<TechnicianResponseDTO> getTechnician(@PathVariable Long id) {
        return ResponseEntity.ok(technicianService.getTechnicianById(id));
    }

    /**
     * GET /api/v1/technicians/by-category?category=ELECTRICAL
     * Returns technicians who handle this category, sorted by rating desc + workload asc.
     * Used by admin assign panel.
     */
    @GetMapping("/by-category")
    public ResponseEntity<List<TechnicianResponseDTO>> getByCategory(
            @RequestParam String category) {
        return ResponseEntity.ok(technicianService.getTechniciansByCategory(category));
    }

    /** POST /api/v1/technicians — create technician (admin) */
    @PostMapping
    public ResponseEntity<TechnicianResponseDTO> createTechnician(
            @Valid @RequestBody TechnicianRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(technicianService.createTechnician(dto));
    }

    /** PUT /api/v1/technicians/{id} — update technician */
    @PutMapping("/{id}")
    public ResponseEntity<TechnicianResponseDTO> updateTechnician(
            @PathVariable Long id,
            @Valid @RequestBody TechnicianRequestDTO dto) {
        return ResponseEntity.ok(technicianService.updateTechnician(id, dto));
    }

    /** DELETE /api/v1/technicians/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTechnician(@PathVariable Long id) {
        technicianService.deleteTechnician(id);
        return ResponseEntity.ok(Map.of("message", "Technician deleted successfully."));
    }

    /** POST /api/v1/technicians/rate — submit a rating for a resolved ticket */
    @PostMapping("/rate")
    public ResponseEntity<TechnicianResponseDTO> rateTechnician(
            @Valid @RequestBody RatingRequestDTO dto) {
        return ResponseEntity.ok(technicianService.rateTechnician(dto));
    }

    /** GET /api/v1/technicians/{id}/ratings — all ratings for a technician */
    @GetMapping("/{id}/ratings")
    public ResponseEntity<List<TechnicianRating>> getRatings(@PathVariable Long id) {
        return ResponseEntity.ok(technicianService.getRatingsForTechnician(id));
    }
}
