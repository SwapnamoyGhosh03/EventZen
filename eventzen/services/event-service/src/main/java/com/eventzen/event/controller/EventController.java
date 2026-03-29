package com.eventzen.event.controller;

import com.eventzen.event.model.dto.*;
import com.eventzen.event.model.enums.EventStatus;
import com.eventzen.event.service.AgendaService;
import com.eventzen.event.service.EventService;
import com.eventzen.event.service.EventSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final EventSessionService sessionService;
    private final AgendaService agendaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER', 'VENDOR')")
    public ResponseEntity<Map<String, Object>> createEvent(
            @Valid @RequestBody CreateEventRequest request,
            Authentication authentication) {
        String organizerId = (String) authentication.getPrincipal();
        EventResponse event = eventService.createEvent(request, organizerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(successResponse(event));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listEvents(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) EventStatus status,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String organizerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<EventResponse> events = eventService.listEvents(q, category, status, city, organizerId, from, to, page, size);
        return ResponseEntity.ok(pagedResponse(events));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getEvent(@PathVariable String id) {
        EventResponse event = eventService.getEvent(id);
        return ResponseEntity.ok(successResponse(event));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER', 'VENDOR')")
    public ResponseEntity<Map<String, Object>> updateEvent(
            @PathVariable String id,
            @Valid @RequestBody UpdateEventRequest request,
            Authentication authentication) {
        String callerId = (String) authentication.getPrincipal();
        boolean isAdmin = isAdminAuth(authentication);
        EventResponse event = eventService.updateEvent(id, request, callerId, isAdmin);
        return ResponseEntity.ok(successResponse(event));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> changeStatus(
            @PathVariable String id,
            @RequestParam EventStatus status) {
        EventResponse event = eventService.changeStatus(id, status);
        return ResponseEntity.ok(successResponse(event));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteEvent(@PathVariable String id) {
        eventService.softDelete(id);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("data", Map.of("message", "Event deleted successfully"));
        return ResponseEntity.ok(body);
    }

    @PostMapping("/{id}/sessions")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER', 'VENDOR')")
    public ResponseEntity<Map<String, Object>> addSession(
            @PathVariable String id,
            @Valid @RequestBody CreateSessionRequest request,
            Authentication authentication) {
        String callerId = (String) authentication.getPrincipal();
        boolean isAdmin = isAdminAuth(authentication);
        EventResponse.SessionResponse session = sessionService.addSession(id, request, callerId, isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(successResponse(session));
    }

    @GetMapping("/{id}/agenda")
    public ResponseEntity<Map<String, Object>> getAgenda(@PathVariable String id) {
        List<EventResponse.AgendaResponse> agenda = agendaService.getAgenda(id);
        return ResponseEntity.ok(successResponse(agenda));
    }

    @PutMapping("/{id}/agenda/reorder")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER', 'VENDOR')")
    public ResponseEntity<Map<String, Object>> reorderAgenda(
            @PathVariable String id,
            @Valid @RequestBody AgendaReorderRequest request,
            Authentication authentication) {
        String callerId = (String) authentication.getPrincipal();
        boolean isAdmin = isAdminAuth(authentication);
        List<EventResponse.AgendaResponse> agenda = agendaService.reorderAgenda(id, request, callerId, isAdmin);
        return ResponseEntity.ok(successResponse(agenda));
    }

    private boolean isAdminAuth(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchEvents(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<EventSearchResponse> results = eventService.searchEvents(q, page, size);
        return ResponseEntity.ok(pagedResponse(results));
    }

    private Map<String, Object> successResponse(Object data) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("data", data);
        return body;
    }

    private <T> Map<String, Object> pagedResponse(Page<T> page) {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("page", page.getNumber());
        meta.put("size", page.getSize());
        meta.put("total", page.getTotalElements());
        meta.put("totalPages", page.getTotalPages());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("data", page.getContent());
        body.put("meta", meta);
        return body;
    }
}
