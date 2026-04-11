package smart_campus_api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enables Spring's scheduled task execution.
 * Used by TicketService for auto-escalation of stale OPEN tickets.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
    // No additional config needed — @Scheduled annotations in services handle the rest.
}
