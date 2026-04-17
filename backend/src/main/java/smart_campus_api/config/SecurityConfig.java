package smart_campus_api.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import smart_campus_api.entity.User;
import smart_campus_api.repository.UserRepository;
import smart_campus_api.service.CustomOAuth2UserService;
import smart_campus_api.service.JwtService;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService oAuth2UserService;
    private final JwtAuthFilter jwtAuthFilter;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:5174"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                // Disable X-Frame-Options restriction so the OAuth redirect back to the
                // frontend is never treated as a frame/embed load by the browser.
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                // STATELESS for JWT-protected API calls.
                // Spring OAuth2 login needs a short-lived session internally for the
                // state/nonce exchange with Google — it creates one automatically even
                // with IF_REQUIRED, then discards it after the callback completes.
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        // Resource catalogue — public reads
                        .requestMatchers(HttpMethod.GET, "/api/v1/resources/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/resource-groups/**").permitAll()

                        // Bookings — GET /my requires auth; all mutations require auth
                        // GET /api/v1/bookings (admin list) also requires auth
                        .requestMatchers(HttpMethod.GET, "/api/v1/bookings/**").authenticated()

                        // Auth endpoints
                        .requestMatchers("/api/v1/auth/me").authenticated()
                        .requestMatchers("/api/v1/auth/logout").authenticated()
                        .requestMatchers("/api/v1/auth/users/**").hasRole("ADMIN")

                        // All write operations require auth
                        .requestMatchers(HttpMethod.POST, "/api/v1/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/**").authenticated()

                        .anyRequest().permitAll()
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(u -> u.userService(oAuth2UserService))
                        .successHandler((request, response, authentication) -> {
                            var oauthUser = (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getPrincipal();
                            String userEmail = oauthUser.getAttribute("email");
                            User user = userRepository.findByEmail(userEmail).orElseThrow();
                            String token = jwtService.generateToken(user);
                            // Strip any accidental trailing slash from frontendUrl so the redirect
                            // never produces a double-slash path like "//auth/callback"
                            String base = frontendUrl.endsWith("/")
                                    ? frontendUrl.substring(0, frontendUrl.length() - 1)
                                    : frontendUrl;
                            response.sendRedirect(base + "/auth/callback?token=" + token);
                        })
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
