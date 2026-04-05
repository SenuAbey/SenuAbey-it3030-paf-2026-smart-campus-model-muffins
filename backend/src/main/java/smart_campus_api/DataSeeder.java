package smart_campus_api;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import smart_campus_api.entity.Resource;
import smart_campus_api.enums.BookingTier;
import smart_campus_api.enums.ResourceStatus;
import smart_campus_api.enums.ResourceType;
import smart_campus_api.repository.ResourceRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ResourceRepository resourceRepository;

    @Override
    public void run(String... args) throws Exception {
        if (resourceRepository.count() > 4) return;

        List<Resource> resources = List.of(
                Resource.builder().name("Main Auditorium").type(ResourceType.AUDITORIUM)
                        .capacity(500).location("Block A, Ground Floor").building("Block A").floor("Ground")
                        .description("Main university auditorium with stage and AV system")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.ADMIN)
                        .bufferMinutes(30).maxBookingHours(8).maxAdvanceDays(30).createdBy("system").build(),

                Resource.builder().name("Computer Lab 101").type(ResourceType.LAB)
                        .capacity(40).location("Block B, Floor 1").building("Block B").floor("Floor 1")
                        .description("40-station PC lab with high speed internet")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.DELEGATED)
                        .bufferMinutes(15).maxBookingHours(4).maxAdvanceDays(14).createdBy("system").build(),

                Resource.builder().name("Computer Lab 102").type(ResourceType.LAB)
                        .capacity(40).location("Block B, Floor 1").building("Block B").floor("Floor 1")
                        .description("40-station PC lab with programming software")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.DELEGATED)
                        .bufferMinutes(15).maxBookingHours(4).maxAdvanceDays(14).createdBy("system").build(),

                Resource.builder().name("Chemistry Lab").type(ResourceType.LAB)
                        .capacity(30).location("Block C, Floor 2").building("Block C").floor("Floor 2")
                        .description("Chemistry lab with fume hoods and safety equipment")
                        .status(ResourceStatus.UNDER_MAINTENANCE).bookingTier(BookingTier.DELEGATED)
                        .bufferMinutes(30).maxBookingHours(3).maxAdvanceDays(7).createdBy("system").build(),

                Resource.builder().name("Lecture Hall A1").type(ResourceType.LECTURE_HALL)
                        .capacity(120).location("Block A, Floor 1").building("Block A").floor("Floor 1")
                        .description("Large lecture hall with projector and mic system")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.INSTANT)
                        .bufferMinutes(15).maxBookingHours(4).maxAdvanceDays(14).createdBy("system").build(),

                Resource.builder().name("Lecture Hall A2").type(ResourceType.LECTURE_HALL)
                        .capacity(80).location("Block A, Floor 2").building("Block A").floor("Floor 2")
                        .description("Medium lecture hall with smart board")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.INSTANT)
                        .bufferMinutes(15).maxBookingHours(4).maxAdvanceDays(14).createdBy("system").build(),

                Resource.builder().name("Meeting Room C1").type(ResourceType.MEETING_ROOM)
                        .capacity(12).location("Block C, Floor 1").building("Block C").floor("Floor 1")
                        .description("Boardroom with video conferencing setup")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.INSTANT)
                        .bufferMinutes(10).maxBookingHours(2).maxAdvanceDays(7).createdBy("system").build(),

                Resource.builder().name("Meeting Room C2").type(ResourceType.MEETING_ROOM)
                        .capacity(8).location("Block C, Floor 1").building("Block C").floor("Floor 1")
                        .description("Small meeting room with whiteboard")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.INSTANT)
                        .bufferMinutes(10).maxBookingHours(2).maxAdvanceDays(7).createdBy("system").build(),

                Resource.builder().name("University Gymnasium").type(ResourceType.GYM)
                        .capacity(100).location("Sports Complex, Ground Floor").building("Sports Complex").floor("Ground")
                        .description("Full gymnasium with equipment and changing rooms")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.INSTANT)
                        .bufferMinutes(30).maxBookingHours(2).maxAdvanceDays(7).createdBy("system").build(),

                Resource.builder().name("Swimming Pool").type(ResourceType.SWIMMING_POOL)
                        .capacity(50).location("Sports Complex, Ground Floor").building("Sports Complex").floor("Ground")
                        .description("Olympic size swimming pool with 8 lanes")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.DELEGATED)
                        .bufferMinutes(30).maxBookingHours(2).maxAdvanceDays(7).createdBy("system").build(),

                Resource.builder().name("Basketball Court").type(ResourceType.SPORTS_COURT)
                        .capacity(30).location("Sports Complex, Outdoor").building("Sports Complex").floor("Outdoor")
                        .description("Full size basketball court with floodlights")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.INSTANT)
                        .bufferMinutes(15).maxBookingHours(2).maxAdvanceDays(7).createdBy("system").build(),

                Resource.builder().name("Main Ground").type(ResourceType.GROUND)
                        .capacity(200).location("Campus Ground, Outdoor").building("Outdoor").floor("Outdoor")
                        .description("Main campus ground for events and sports")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.ADMIN)
                        .bufferMinutes(60).maxBookingHours(8).maxAdvanceDays(30).createdBy("system").build(),

                Resource.builder().name("Projector Unit A").type(ResourceType.EQUIPMENT)
                        .capacity(null).location("Block A, Store Room").building("Block A").floor("Ground")
                        .description("Epson 4K portable projector with HDMI")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.INSTANT)
                        .bufferMinutes(0).maxBookingHours(8).maxAdvanceDays(3).createdBy("system").build(),

                Resource.builder().name("Sony Camera Kit").type(ResourceType.EQUIPMENT)
                        .capacity(null).location("Media Room, Block A").building("Block A").floor("Floor 1")
                        .description("Sony FX3 camera with tripod and lenses")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.DELEGATED)
                        .bufferMinutes(0).maxBookingHours(8).maxAdvanceDays(3).createdBy("system").build(),

                Resource.builder().name("Innovation Lab").type(ResourceType.LAB)
                        .capacity(25).location("Block A, Floor 3").building("Block A").floor("Floor 3")
                        .description("Maker space with 3D printers and IoT kits")
                        .status(ResourceStatus.ACTIVE).bookingTier(BookingTier.DELEGATED)
                        .bufferMinutes(15).maxBookingHours(4).maxAdvanceDays(14).createdBy("system").build()
        );

        resourceRepository.saveAll(resources);
        System.out.println("✅ Sample data seeded successfully!");
    }
}