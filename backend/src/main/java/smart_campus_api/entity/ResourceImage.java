package smart_campus_api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "resource_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "resource_id")
    private Resource resource;

    private String imageUrl;
    private String caption;
    private boolean isPrimary = false;
    private String uploadedBy;

    @CreationTimestamp
    private LocalDateTime uploadedAt;
}