package smart_campus_api.exception;

// ──────────────────────────────────────────────────────────────────────────────
// NOTE TO TEAM: This file shows the exception handling additions for Module C.
// Merge these handler methods into the existing GlobalExceptionHandler.java
// that was created by Module A. Do NOT create a duplicate @ControllerAdvice class.
// ──────────────────────────────────────────────────────────────────────────────

// The existing GlobalExceptionHandler should already have:
//   @RestControllerAdvice
//   public class GlobalExceptionHandler {
//       @ExceptionHandler(ResourceNotFoundException.class) ...
//       @ExceptionHandler(MethodArgumentNotValidException.class) ...
//   }

// ADD these methods to the existing GlobalExceptionHandler class:

/*

    // Handles ticket-not-found and other RuntimeExceptions from Module C
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", HttpStatus.BAD_REQUEST.value());
        error.put("error", "Bad Request");
        error.put("message", ex.getMessage());

        // Return 404 if the message indicates "not found"
        if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("not found")) {
            error.put("status", HttpStatus.NOT_FOUND.value());
            error.put("error", "Not Found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Handles file upload size exceeded
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceeded(
            org.springframework.web.multipart.MaxUploadSizeExceededException ex) {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", HttpStatus.PAYLOAD_TOO_LARGE.value());
        error.put("error", "Payload Too Large");
        error.put("message", "File size exceeds the maximum allowed limit of 10MB.");
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(error);
    }

*/

// This file is documentation only — add the above methods to GlobalExceptionHandler.java
public class TicketExceptionHandlerAdditions {
    // intentionally empty — see comments above
}
