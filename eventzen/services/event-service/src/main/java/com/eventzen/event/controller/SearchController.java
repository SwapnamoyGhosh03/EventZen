package com.eventzen.event.controller;

import com.eventzen.event.model.dto.EventSearchResponse;
import com.eventzen.event.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Dedicated search controller.
 * Currently delegates to MySQL LIKE-based search.
 * Will be enhanced with Elasticsearch integration for production.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SearchController {

    private final EventService eventService;

    @GetMapping("/search/events")
    public ResponseEntity<Map<String, Object>> searchEvents(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<EventSearchResponse> results = eventService.searchEvents(q, page, size);

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("page", results.getNumber());
        meta.put("size", results.getSize());
        meta.put("total", results.getTotalElements());
        meta.put("totalPages", results.getTotalPages());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("data", results.getContent());
        body.put("meta", meta);
        return ResponseEntity.ok(body);
    }
}
