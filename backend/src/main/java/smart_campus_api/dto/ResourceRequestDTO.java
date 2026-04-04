package smart_campus_api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import smart_campus_api.enums.BookingTier;
import smart_campus_api.enums.ResourceStatus;
import smart_campus_api.enums.ResourceType;

@Data
public class ResourceRequestDTO {

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Type is required")
    private ResourceType type;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    private String location;

    private String building;
    private String floor;
    private String description;
    private ResourceStatus status = ResourceStatus.ACTIVE;
    private BookingTier bookingTier = BookingTier.INSTANT;
    private Integer bufferMinutes = 15;
    private Integer maxBookingHours = 4;
    private Integer maxAdvanceDays = 14;

}
