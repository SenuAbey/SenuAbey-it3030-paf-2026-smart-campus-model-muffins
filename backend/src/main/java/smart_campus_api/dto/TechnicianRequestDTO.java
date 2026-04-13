package smart_campus_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

// ─── Request DTO ─────────────────────────────────────────────────────────────
public class TechnicianRequestDTO {

    @NotBlank(message = "Name is required")
    private String name;

    @Email
    @NotBlank(message = "Email is required")
    private String email;

    private String phone;

    // List of category names e.g. ["ELECTRICAL", "HVAC"]
    private List<String> specializations;

    private boolean available = true;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public List<String> getSpecializations() { return specializations; }
    public void setSpecializations(List<String> specializations) { this.specializations = specializations; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
}
