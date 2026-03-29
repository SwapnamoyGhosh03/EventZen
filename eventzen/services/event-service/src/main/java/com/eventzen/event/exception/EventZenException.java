package com.eventzen.event.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class EventZenException extends RuntimeException {

    private final HttpStatus status;

    public EventZenException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
