package smart_campus_api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smart_campus_api.dto.RatingRequestDTO;
import smart_campus_api.dto.TechnicianRequestDTO;
import smart_campus_api.dto.TechnicianResponseDTO;
import smart_campus_api.entity.Technician;
import smart_campus_api.entity.TechnicianRating;
import smart_campus_api.repository.TechnicianRatingRepository;
import smart_campus_api.repository.TechnicianRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TechnicianService {

    @Autowired private TechnicianRepository technicianRepository;
    @Autowired private TechnicianRatingRepository ratingRepository;

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    @Transactional
    public TechnicianResponseDTO createTechnician(TechnicianRequestDTO dto) {
        if (technicianRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("A technician with email " + dto.getEmail() + " already exists.");
        }
        Technician tech = new Technician();
        tech.setName(dto.getName());
        tech.setEmail(dto.getEmail());
        tech.setPhone(dto.getPhone());
        tech.setAvailable(dto.isAvailable());
        if (dto.getSpecializations() != null) {
            tech.setSpecializations(String.join(",", dto.getSpecializations()));
        }
        return toDTO(technicianRepository.save(tech));
    }

    public List<TechnicianResponseDTO> getAllTechnicians() {
        return technicianRepository.findAll()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public TechnicianResponseDTO getTechnicianById(Long id) {
        return toDTO(technicianRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Technician not found with id: " + id)));
    }

    @Transactional
    public TechnicianResponseDTO updateTechnician(Long id, TechnicianRequestDTO dto) {
        Technician tech = technicianRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Technician not found with id: " + id));
        tech.setName(dto.getName());
        tech.setPhone(dto.getPhone());
        tech.setAvailable(dto.isAvailable());
        if (dto.getSpecializations() != null) {
            tech.setSpecializations(String.join(",", dto.getSpecializations()));
        }
        return toDTO(technicianRepository.save(tech));
    }

    @Transactional
    public void deleteTechnician(Long id) {
        Technician tech = technicianRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Technician not found with id: " + id));
        technicianRepository.delete(tech);
    }

    // ─── FILTERED LIST FOR ASSIGNMENT ────────────────────────────────────────

    /**
     * Returns technicians filtered by category, sorted by rating desc and workload asc.
     * Used by admin when assigning a ticket.
     */
    public List<TechnicianResponseDTO> getTechniciansByCategory(String category) {
        List<Technician> result = technicianRepository.findAvailableByCategory(category);
        // If none found by specialization, return all available as fallback
        if (result.isEmpty()) {
            result = technicianRepository.findByAvailableTrue();
        }
        return result.stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ─── WORKLOAD UPDATE (called by TicketService on assign/resolve) ──────────

    @Transactional
    public void incrementActiveTickets(String technicianEmail) {
        technicianRepository.findByEmail(technicianEmail).ifPresent(tech -> {
            tech.setActiveTicketCount(tech.getActiveTicketCount() + 1);
            technicianRepository.save(tech);
        });
    }

    @Transactional
    public void decrementActiveTickets(String technicianEmail) {
        technicianRepository.findByEmail(technicianEmail).ifPresent(tech -> {
            int count = Math.max(0, tech.getActiveTicketCount() - 1);
            tech.setActiveTicketCount(count);
            tech.setCompletedTicketCount(tech.getCompletedTicketCount() + 1);
            technicianRepository.save(tech);
        });
    }

    // ─── RATING ───────────────────────────────────────────────────────────────

    @Transactional
    public TechnicianResponseDTO rateTechnician(RatingRequestDTO dto) {
        Technician tech = technicianRepository.findById(dto.getTechnicianId())
                .orElseThrow(() -> new RuntimeException("Technician not found with id: " + dto.getTechnicianId()));

        if (ratingRepository.existsByTechnicianIdAndTicketId(dto.getTechnicianId(), dto.getTicketId())) {
            throw new RuntimeException("This ticket has already been rated for this technician.");
        }

        // Save the rating record
        TechnicianRating rating = new TechnicianRating();
        rating.setTechnicianId(dto.getTechnicianId());
        rating.setTicketId(dto.getTicketId());
        rating.setQualityScore(dto.getQualityScore());
        rating.setTimeScore(dto.getTimeScore());
        rating.setFeedback(dto.getFeedback());
        rating.setRatedBy(dto.getRatedBy());

        double overall = (dto.getQualityScore() + dto.getTimeScore()) / 2.0;
        rating.setOverallScore(overall);
        ratingRepository.save(rating);

        // Update technician's running average
        tech.setTotalRatingScore(tech.getTotalRatingScore() + overall);
        tech.setRatingCount(tech.getRatingCount() + 1);
        tech.setAverageRating(
            Math.round((tech.getTotalRatingScore() / tech.getRatingCount()) * 10.0) / 10.0
        );
        return toDTO(technicianRepository.save(tech));
    }

    public List<TechnicianRating> getRatingsForTechnician(Long technicianId) {
        return ratingRepository.findByTechnicianIdOrderByCreatedAtDesc(technicianId);
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private TechnicianResponseDTO toDTO(Technician tech) {
        TechnicianResponseDTO dto = new TechnicianResponseDTO();
        dto.setId(tech.getId());
        dto.setName(tech.getName());
        dto.setEmail(tech.getEmail());
        dto.setPhone(tech.getPhone());
        dto.setAvailable(tech.isAvailable());
        dto.setSpecializations(tech.getSpecializationList());
        dto.setAverageRating(tech.getAverageRating());
        dto.setRatingCount(tech.getRatingCount());
        dto.setActiveTicketCount(tech.getActiveTicketCount());
        dto.setCompletedTicketCount(tech.getCompletedTicketCount());
        dto.setCreatedAt(tech.getCreatedAt());
        return dto;
    }
}
