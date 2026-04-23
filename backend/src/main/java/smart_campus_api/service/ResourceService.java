package smart_campus_api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import smart_campus_api.dto.ResourceRequestDTO;
import smart_campus_api.dto.ResourceResponseDTO;
import smart_campus_api.entity.Resource;
import smart_campus_api.enums.ResourceStatus;
import smart_campus_api.enums.ResourceType;
import smart_campus_api.repository.ResourceRepository;
import smart_campus_api.service.ImageStorageService;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ImageStorageService imageStorageService;

    public ResourceResponseDTO createResource(ResourceRequestDTO dto, String createdBy) {
        Resource resource = mapToEntity(dto);
        resource.setCreatedBy(createdBy);
        return mapToDTO(resourceRepository.save(resource));
    }

    public Page<ResourceResponseDTO> searchResources(
            ResourceType type, ResourceStatus status, String location,
            Integer minCapacity, String search, int page, int size, String sortBy) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        return resourceRepository.searchResources(
                        type, status, location, minCapacity, search, pageable)
                .map(this::mapToDTO);
    }

    public ResourceResponseDTO getById(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found: " + id));
        return mapToDTO(resource);
    }

    public ResourceResponseDTO updateResource(String id, ResourceRequestDTO dto) {
        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found: " + id));
        existing.setName(dto.getName());
        existing.setType(dto.getType());
        existing.setCapacity(dto.getCapacity());
        existing.setLocation(dto.getLocation());
        existing.setBuilding(dto.getBuilding());
        existing.setFloor(dto.getFloor());
        existing.setDescription(dto.getDescription());
        existing.setStatus(dto.getStatus());
        existing.setBookingTier(dto.getBookingTier());
        existing.setBufferMinutes(dto.getBufferMinutes());
        existing.setMaxBookingHours(dto.getMaxBookingHours());
        existing.setMaxAdvanceDays(dto.getMaxAdvanceDays());
        return mapToDTO(resourceRepository.save(existing));
    }

    public void deleteResource(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new RuntimeException("Resource not found: " + id);
        }
        resourceRepository.deleteById(id);
    }

    public ResourceResponseDTO updateStatus(String id, ResourceStatus status) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found: " + id));
        resource.setStatus(status);
        return mapToDTO(resourceRepository.save(resource));
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalResources", resourceRepository.count());
        stats.put("activeResources", resourceRepository.countByStatus(ResourceStatus.ACTIVE));
        stats.put("outOfService", resourceRepository.countByStatus(ResourceStatus.OUT_OF_SERVICE));
        stats.put("underMaintenance", resourceRepository.countByStatus(ResourceStatus.UNDER_MAINTENANCE));
        stats.put("byType", Arrays.stream(ResourceType.values())
                .collect(Collectors.toMap(
                        ResourceType::name,
                        t -> resourceRepository.countByType(t)
                )));
        return stats;
    }

    private Resource mapToEntity(ResourceRequestDTO dto) {
        return Resource.builder()
                .name(dto.getName())
                .type(dto.getType())
                .capacity(dto.getCapacity())
                .location(dto.getLocation())
                .building(dto.getBuilding())
                .floor(dto.getFloor())
                .description(dto.getDescription())
                .status(dto.getStatus())
                .bookingTier(dto.getBookingTier())
                .bufferMinutes(dto.getBufferMinutes())
                .maxBookingHours(dto.getMaxBookingHours())
                .maxAdvanceDays(dto.getMaxAdvanceDays())
                .build();
    }

    private ResourceResponseDTO mapToDTO(Resource resource) {
        return ResourceResponseDTO.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .building(resource.getBuilding())
                .floor(resource.getFloor())
                .description(resource.getDescription())
                .imageUrl(resource.getImageUrl())
                .status(resource.getStatus())
                .bookingTier(resource.getBookingTier())
                .bufferMinutes(resource.getBufferMinutes())
                .maxBookingHours(resource.getMaxBookingHours())
                .maxAdvanceDays(resource.getMaxAdvanceDays())
                .createdBy(resource.getCreatedBy())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }

    public ResourceResponseDTO uploadImage(String id, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found: " + id));

        if (resource.getImageUrl() != null) {
            imageStorageService.deleteImage(resource.getImageUrl());
        }

        String imageUrl = imageStorageService.saveImage(file);
        resource.setImageUrl(imageUrl);
        return mapToDTO(resourceRepository.save(resource));
    }


}
