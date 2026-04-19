package smart_campus_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import smart_campus_api.entity.Notification;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);
    long countByRecipientEmailAndReadFalse(String recipientEmail);
}