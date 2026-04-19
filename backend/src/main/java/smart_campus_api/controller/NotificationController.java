package smart_campus_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import smart_campus_api.entity.Notification;
import smart_campus_api.entity.User;
import smart_campus_api.service.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // GET /api/v1/notifications — get all notifications for logged in user
    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getNotifications(user.getEmail()));
    }

    // GET /api/v1/notifications/unread-count — get unread count
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal User user) {
        long count = notificationService.getUnreadCount(user.getEmail());
        return ResponseEntity.ok(Map.of("count", count));
    }

    // PATCH /api/v1/notifications/mark-all-read — mark all as read
    @PatchMapping("/mark-all-read")
    public ResponseEntity<Map<String, String>> markAllRead(
            @AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getEmail());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}