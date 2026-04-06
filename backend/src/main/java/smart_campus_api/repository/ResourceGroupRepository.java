package smart_campus_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smart_campus_api.entity.ResourceGroup;

@Repository
public interface ResourceGroupRepository extends JpaRepository<ResourceGroup, String> {
}