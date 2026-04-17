package smart_campus_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import smart_campus_api.entity.User;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}