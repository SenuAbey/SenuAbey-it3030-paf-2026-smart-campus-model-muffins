package smart_campus_api.dto;

import lombok.Builder;
import lombok.Data;
import smart_campus_api.enums.BookingTier;
import smart_campus_api.enums.ResourceStatus;
import smart_campus_api.enums.ResourceType;

import java.time.LocalDateTime;

@Data
@Builder
public class ResourceResponseDTO {
    private String id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private String building;
    private String floor;
    private String description;
    private String imageUrl;
    private ResourceStatus status;
    private BookingTier bookingTier;
    private Integer bufferMinutes;
    private Integer maxBookingHours;
    private Integer maxAdvanceDays;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean availableNow;
}
