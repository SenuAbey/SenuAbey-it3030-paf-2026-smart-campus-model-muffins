package smart_campus_api.entity;

import jakarta.persistence.*;
import lombok.*;
import smart_campus_api.enums.Role;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;
    private String profilePicture;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String provider;
    private String providerId;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
