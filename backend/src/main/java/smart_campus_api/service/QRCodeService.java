package smart_campus_api.service;

import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

@Service
public class QRCodeService {

    public byte[] generateQRCode(String text, int width, int height) throws Exception {
        // Use QuickChart API (free, no dependencies needed)
        String encodedText = URLEncoder.encode(text, "UTF-8");
        String qrUrl = String.format("https://quickchart.io/qr?text=%s&size=%d", encodedText, width);

        URL url = new URL(qrUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(5000);

        try (InputStream inputStream = connection.getInputStream();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            return outputStream.toByteArray();
        }
    }

    public String generateCheckInUrl(Long bookingId, String frontendUrl) {
        return frontendUrl + "/checkin?bookingId=" + bookingId;
    }
}