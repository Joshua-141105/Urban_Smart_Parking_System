package com.example.parkingsystem.exception;

import com.example.parkingsystem.dto.MessageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<MessageResponse> handleRuntimeException(RuntimeException ex) {
        return new ResponseEntity<>(new MessageResponse(ex.getMessage()), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<MessageResponse> handleValidationException(MethodArgumentNotValidException ex) {
        String errorMsg = ex.getBindingResult().getAllErrors().stream()
                .map(err -> err.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return new ResponseEntity<>(new MessageResponse("Validation Error: " + errorMsg), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<MessageResponse> handleAccessDeniedException(
            org.springframework.security.access.AccessDeniedException ex) {
        return new ResponseEntity<>(
                new MessageResponse("Access Denied: You do not have permission to perform this action"),
                HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponse> handleGeneralException(Exception ex) {
        return new ResponseEntity<>(new MessageResponse("Internal Server Error: " + ex.getMessage()),
                HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
