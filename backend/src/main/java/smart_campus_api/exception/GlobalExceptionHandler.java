package smart_campus_api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler for all modules.
 *
 * Module A created the base version.
 * Module C added: RuntimeException handler, MaxUploadSizeExceededException handler.
 *
 * DROP THIS FILE IN: backend/src/main/java/smart_campus_api/exception/GlobalExceptionHandler.java
 * (Replace the existing file — this is the merged version)
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ─── Module A: ResourceNotFoundException ─────────────────────────────────

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        Map<String, Object> error = buildError(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    // ─── Both Modules: Bean Validation failures (@Valid) ─────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        // Collect all field errors into a readable map
        Map<String, String> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing // keep first error per field
                ));

        Map<String, Object> error = buildError(HttpStatus.BAD_REQUEST, "Validation Failed",
                "Request body contains invalid fields");
        error.put("fieldErrors", fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // ─── Module C: General RuntimeException (ticket not found, permission denied, etc.) ──

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred";

        // Detect "not found" messages and return 404
        if (message.toLowerCase().contains("not found")) {
            Map<String, Object> error = buildError(HttpStatus.NOT_FOUND, "Not Found", message);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        // Detect permission/authorization errors and return 403
        if (message.toLowerCase().contains("permission") ||
            message.toLowerCase().contains("not authorized") ||
            message.toLowerCase().contains("only the original")) {
            Map<String, Object> error = buildError(HttpStatus.FORBIDDEN, "Forbidden", message);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        // Detect invalid status transitions and return 422
        if (message.toLowerCase().contains("invalid status transition")) {
            Map<String, Object> error = buildError(
                    HttpStatus.UNPROCESSABLE_ENTITY, "Invalid Workflow Transition", message);
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(error);
        }

        // Default: 400 Bad Request
        Map<String, Object> error = buildError(HttpStatus.BAD_REQUEST, "Bad Request", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // ─── Module C: File size exceeded ────────────────────────────────────────

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        Map<String, Object> error = buildError(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "Payload Too Large",
                "File size exceeds the maximum allowed limit of 10MB per file.");
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(error);
    }

    // ─── Catch-all for unexpected errors ─────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        Map<String, Object> error = buildError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                "An unexpected error occurred. Please try again or contact support.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private Map<String, Object> buildError(HttpStatus status, String error, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        return body;
    }
}
