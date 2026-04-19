package smart_campus_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import smart_campus_api.entity.Notification;
import smart_campus_api.entity.User;
import smart_campus_api.enums.Role;
import smart_campus_api.repository.NotificationRepository;
import smart_campus_api.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // Called when a user submits a booking — notify all ADMINs
    public void notifyAdminsNewBooking(String bookedBy, String resourceName) {
        List<User> admins = userRepository.findAll()
                .stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .toList();

        for (User admin : admins) {
            Notification notification = Notification.builder()
                    .recipientEmail(admin.getEmail())
                    .title("New Booking Request")
                    .message(bookedBy + " requested to book " + resourceName)
                    .type("BOOKING_REQUEST")
                    .read(false)
                    .build();
            notificationRepository.save(notification);
        }
    }

    // Called when admin approves — notify the user
    public void notifyUserBookingApproved(String userEmail, String resourceName) {
        Notification notification = Notification.builder()
                .recipientEmail(userEmail)
                .title("Booking Approved ✅")
                .message("Your booking for " + resourceName + " has been approved!")
                .type("BOOKING_APPROVED")
                .read(false)
                .build();
        notificationRepository.save(notification);
    }

    // Called when admin rejects — notify the user
    public void notifyUserBookingRejected(String userEmail, String resourceName, String reason) {
        Notification notification = Notification.builder()
                .recipientEmail(userEmail)
                .title("Booking Rejected ❌")
                .message("Your booking for " + resourceName + " was rejected. Reason: " + reason)
                .type("BOOKING_REJECTED")
                .read(false)
                .build();
        notificationRepository.save(notification);
    }

    // Get all notifications for a user
    public List<Notification> getNotifications(String email) {
        return notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email);
    }

    // Get unread count
    public long getUnreadCount(String email) {
        return notificationRepository.countByRecipientEmailAndReadFalse(email);
    }

    // Mark all as read
    public void markAllAsRead(String email) {
        List<Notification> notifications = notificationRepository
                .findByRecipientEmailOrderByCreatedAtDesc(email);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    // Called when a user creates a ticket — notify all ADMINs
public void notifyAdminsNewTicket(String reportedBy, String ticketTitle) {
    List<User> admins = userRepository.findAll()
            .stream()
            .filter(u -> u.getRole() == Role.ADMIN)
            .toList();

    for (User admin : admins) {
        Notification notification = Notification.builder()
                .recipientEmail(admin.getEmail())
                .title("New Incident Ticket")
                .message(reportedBy + " reported: " + ticketTitle)
                .type("TICKET_CREATED")
                .read(false)
                .build();
        notificationRepository.save(notification);
    }
}

// Called when admin updates ticket status — notify the user
public void notifyUserTicketStatusChanged(String userEmail, String ticketTitle, String newStatus) {
    Notification notification = Notification.builder()
            .recipientEmail(userEmail)
            .title("Ticket Status Updated")
            .message("Your ticket \"" + ticketTitle + "\" is now " + newStatus)
            .type("TICKET_STATUS_CHANGED")
            .read(false)
            .build();
    notificationRepository.save(notification);
}

// Called when user adds a comment — notify all ADMINs
public void notifyAdminsNewComment(String commentedBy, String ticketTitle, Long ticketId) {
    List<User> admins = userRepository.findAll()
            .stream()
            .filter(u -> u.getRole() == Role.ADMIN)
            .toList();

    for (User admin : admins) {
        Notification notification = Notification.builder()
                .recipientEmail(admin.getEmail())
                .title("New Comment on Ticket 💬")
                .message(commentedBy + " commented on \"" + ticketTitle + "\" (Ticket #" + ticketId + ")")
                .type("TICKET_COMMENT")
                .read(false)
                .build();
        notificationRepository.save(notification);
    }
}

// Called when user uploads attachment — notify all ADMINs
public void notifyAdminsNewAttachment(String uploadedBy, String ticketTitle, Long ticketId) {
    List<User> admins = userRepository.findAll()
            .stream()
            .filter(u -> u.getRole() == Role.ADMIN)
            .toList();

    for (User admin : admins) {
        Notification notification = Notification.builder()
                .recipientEmail(admin.getEmail())
                .title("New Attachment on Ticket 📎")
                .message(uploadedBy + " uploaded evidence on \"" + ticketTitle + "\" (Ticket #" + ticketId + ")")
                .type("TICKET_ATTACHMENT")
                .read(false)
                .build();
        notificationRepository.save(notification);
    }
}
}