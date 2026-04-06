package smart_campus_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smart_campus_api.dto.ResourceGroupDTO;
import smart_campus_api.entity.ResourceGroup;
import smart_campus_api.service.ResourceGroupService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/resource-groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ResourceGroupController {

    private final ResourceGroupService resourceGroupService;

    @GetMapping
    public ResponseEntity<List<ResourceGroup>> getAllGroups() {
        return ResponseEntity.ok(resourceGroupService.getAllGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceGroup> getGroup(@PathVariable String id) {
        return ResponseEntity.ok(resourceGroupService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ResourceGroup> createGroup(@Valid @RequestBody ResourceGroupDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceGroupService.createGroup(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceGroup> updateGroup(
            @PathVariable String id,
            @Valid @RequestBody ResourceGroupDTO dto) {
        return ResponseEntity.ok(resourceGroupService.updateGroup(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable String id) {
        resourceGroupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }
}