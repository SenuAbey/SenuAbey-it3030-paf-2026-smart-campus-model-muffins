package smart_campus_api.dto;

import lombok.*;
import smart_campus_api.enums.Role;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponseDTO {
    private Long id;
    private String email;
    private String name;
    private String profilePicture;
    private Role role;
}