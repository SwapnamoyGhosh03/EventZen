package com.eventzen.event.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends EventZenException {

    public ResourceNotFoundException(String resource, String id) {
        super(resource + " not found with id: " + id, HttpStatus.NOT_FOUND);
    }
}
