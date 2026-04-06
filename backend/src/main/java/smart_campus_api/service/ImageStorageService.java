package smart_campus_api.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ImageStorageService {

    private final String uploadDir = "uploads/resources/";

    public String saveImage(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String extension = getExtension(file.getOriginalFilename());

        String originalName = file.getOriginalFilename() != null ?
                file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_") : "image";
        String fileName = originalName.replace("." + extension, "") + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + extension;

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        return "/uploads/resources/" + fileName;
    }

    public void deleteImage(String imageUrl) throws IOException {
        if (imageUrl == null) return;
        Path filePath = Paths.get(imageUrl.substring(1));
        Files.deleteIfExists(filePath);
    }

    private String getExtension(String filename) {
        if (filename == null) return "jpg";
        int dot = filename.lastIndexOf(".");
        return dot >= 0 ? filename.substring(dot + 1) : "jpg";
    }
}