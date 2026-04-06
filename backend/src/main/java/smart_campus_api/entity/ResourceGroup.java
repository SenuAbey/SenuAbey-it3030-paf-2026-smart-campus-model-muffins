package smart_campus_api.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import smart_campus_api.enums.BookingTier;

import java.time.LocalDateTime;

@Entity
@Table(name = "resource_groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank(message = "Group name is required")
    private String name;

    private String description;
    private String delegateRole;

    @Enumerated(EnumType.STRING)
    private BookingTier defaultTier = BookingTier.INSTANT;

    private Integer maxBookingHours = 4;
    private Integer maxAdvanceDays = 14;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
