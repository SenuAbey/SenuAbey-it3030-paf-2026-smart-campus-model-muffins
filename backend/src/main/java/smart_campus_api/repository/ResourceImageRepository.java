package smart_campus_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smart_campus_api.entity.ResourceImage;
import java.util.List;

@Repository
public interface ResourceImageRepository extends JpaRepository<ResourceImage, String> {
    List<ResourceImage> findByResourceId(String resourceId);
    long countByResourceId(String resourceId);
}