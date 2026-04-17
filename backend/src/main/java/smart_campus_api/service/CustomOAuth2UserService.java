package smart_campus_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.*;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import smart_campus_api.entity.User;
import smart_campus_api.enums.Role;
import smart_campus_api.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    private static final java.util.List<String> ADMIN_EMAILS = java.util.List.of(
            "vinusha.perera22@gmail.com"  // replace with your team's admin emails
    );

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) {
        OAuth2User oAuth2User = super.loadUser(request);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String providerId = oAuth2User.getAttribute("sub");

        userRepository.findByEmail(email).orElseGet(() -> {
            boolean isAdmin = ADMIN_EMAILS.contains(email) || userRepository.count() == 0;

            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .profilePicture(picture)
                    .provider("google")
                    .providerId(providerId)
                    .role(isAdmin ? Role.ADMIN : Role.USER)
                    .build();
            return userRepository.save(newUser);
        });

        return oAuth2User;
    }
}