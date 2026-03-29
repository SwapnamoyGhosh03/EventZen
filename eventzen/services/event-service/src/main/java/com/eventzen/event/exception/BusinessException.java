package com.eventzen.event.exception;

import org.springframework.http.HttpStatus;

public class BusinessException extends EventZenException {

    public BusinessException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
