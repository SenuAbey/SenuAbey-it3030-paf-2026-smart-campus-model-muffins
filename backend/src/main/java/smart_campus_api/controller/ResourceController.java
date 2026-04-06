package smart_campus_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smart_campus_api.dto.ResourceRequestDTO;
import smart_campus_api.dto.ResourceResponseDTO;
import smart_campus_api.enums.ResourceStatus;
import smart_campus_api.enums.ResourceType;
import smart_campus_api.service.ResourceService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ResourceController {
    private final ResourceService resourceService;

    // GET - Search and filter resources
    @GetMapping
    public ResponseEntity<Page<ResourceResponseDTO>> searchResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "name") String sortBy) {
        return ResponseEntity.ok(
                resourceService.searchResources(
                        type, status, location, minCapacity, search, page, size, sortBy));
    }

    // GET - Get single resource by ID
    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> getResource(@PathVariable String id) {
        return ResponseEntity.ok(resourceService.getById(id));
    }

    // POST - Create new resource
    @PostMapping
    public ResponseEntity<ResourceResponseDTO> createResource(
            @Valid @RequestBody ResourceRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.createResource(dto, "system"));
    }

    // PUT - Update existing resource
    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> updateResource(
            @PathVariable String id,
            @Valid @RequestBody ResourceRequestDTO dto) {
        return ResponseEntity.ok(resourceService.updateResource(id, dto));
    }

    // DELETE - Delete resource
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }

    // PATCH - Update resource status only
    @PatchMapping("/{id}/status")
    public ResponseEntity<ResourceResponseDTO> updateStatus(
            @PathVariable String id,
            @RequestParam ResourceStatus status) {
        return ResponseEntity.ok(resourceService.updateStatus(id, status));
    }

    // GET - Dashboard statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(resourceService.getDashboardStats());
    }

    // POST - Upload image for a resource
    @PostMapping("/{id}/image")
    public ResponseEntity<ResourceResponseDTO> uploadImage(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(resourceService.uploadImage(id, file));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
