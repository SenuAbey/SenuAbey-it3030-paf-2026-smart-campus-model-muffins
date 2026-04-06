package smart_campus_api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import smart_campus_api.enums.BookingTier;

@Data
public class ResourceGroupDTO {

    @NotBlank(message = "Group name is required")
    private String name;

    private String description;
    private String delegateRole;
    private BookingTier defaultTier = BookingTier.INSTANT;
    private Integer maxBookingHours = 4;
    private Integer maxAdvanceDays = 14;
}