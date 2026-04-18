package smart_campus_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import smart_campus_api.entity.Technician;
import smart_campus_api.repository.TechnicianRepository;

/**
 * Seeds 12 sample technicians (3 per major category) on startup.
 * Only runs if the technicians table is empty.
 */
@Component
@Order(2) // Run after Module A's DataSeeder
public class TechnicianDataSeeder implements CommandLineRunner {

    @Autowired
    private TechnicianRepository technicianRepository;

    @Override
    public void run(String... args) {
        if (technicianRepository.count() > 0) return; // Already seeded

        String[][] data = {
            // name, email, phone, specializations
            {"Kamal Perera",   "kamal.perera@sliit.lk",   "0771001001", "ELECTRICAL,SAFETY"},
            {"Saman Silva",    "saman.silva@sliit.lk",    "0771001002", "ELECTRICAL,HVAC"},
            {"Nimal Fernando", "nimal.fernando@sliit.lk", "0771001003", "ELECTRICAL,PLUMBING"},
            {"Priya Jayawardena","priya.jay@sliit.lk",    "0771001004", "PLUMBING,CLEANING"},
            {"Ruwan Bandara",  "ruwan.bandara@sliit.lk",  "0771001005", "PLUMBING,HVAC"},
            {"Asanka Rajapaksa","asanka.raj@sliit.lk",    "0771001006", "HVAC,ELECTRICAL"},
            {"Chaminda Dias",  "chaminda.dias@sliit.lk",  "0771001007", "IT_EQUIPMENT,ELECTRICAL"},
            {"Tharaka Wickrama","tharaka.wick@sliit.lk",  "0771001008", "IT_EQUIPMENT,FURNITURE"},
            {"Sajith Kumara",  "sajith.kumara@sliit.lk",  "0771001009", "IT_EQUIPMENT,SAFETY"},
            {"Dilhani Senanayake","dilhani.sen@sliit.lk", "0771001010", "FURNITURE,CLEANING"},
            {"Malika Gunasekara","malika.guna@sliit.lk",  "0771001011", "SAFETY,CLEANING"},
            {"Roshan Mendis",  "roshan.mendis@sliit.lk",  "0771001012", "OTHER,FURNITURE"},
        };

        for (String[] row : data) {
            Technician tech = new Technician();
            tech.setName(row[0]);
            tech.setEmail(row[1]);
            tech.setPhone(row[2]);
            tech.setSpecializations(row[3]);
            tech.setAvailable(true);
            technicianRepository.save(tech);
        }

        System.out.println("✅ 12 sample technicians seeded successfully!");
    }
}
