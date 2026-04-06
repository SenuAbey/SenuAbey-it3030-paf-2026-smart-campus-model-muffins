package smart_campus_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import smart_campus_api.dto.ResourceGroupDTO;
import smart_campus_api.entity.ResourceGroup;
import smart_campus_api.repository.ResourceGroupRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceGroupService {

    private final ResourceGroupRepository resourceGroupRepository;

    public ResourceGroup createGroup(ResourceGroupDTO dto) {
        ResourceGroup group = ResourceGroup.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .delegateRole(dto.getDelegateRole())
                .defaultTier(dto.getDefaultTier())
                .maxBookingHours(dto.getMaxBookingHours())
                .maxAdvanceDays(dto.getMaxAdvanceDays())
                .build();
        return resourceGroupRepository.save(group);
    }

    public List<ResourceGroup> getAllGroups() {
        return resourceGroupRepository.findAll();
    }

    public ResourceGroup getById(String id) {
        return resourceGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found: " + id));
    }

    public ResourceGroup updateGroup(String id, ResourceGroupDTO dto) {
        ResourceGroup existing = resourceGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found: " + id));
        existing.setName(dto.getName());
        existing.setDescription(dto.getDescription());
        existing.setDelegateRole(dto.getDelegateRole());
        existing.setDefaultTier(dto.getDefaultTier());
        existing.setMaxBookingHours(dto.getMaxBookingHours());
        existing.setMaxAdvanceDays(dto.getMaxAdvanceDays());
        return resourceGroupRepository.save(existing);
    }

    public void deleteGroup(String id) {
        if (!resourceGroupRepository.existsById(id)) {
            throw new RuntimeException("Group not found: " + id);
        }
        resourceGroupRepository.deleteById(id);
    }
}