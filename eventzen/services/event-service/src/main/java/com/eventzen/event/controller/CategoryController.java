package com.eventzen.event.controller;

import com.eventzen.event.model.entity.EventCategory;
import com.eventzen.event.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllCategories() {
        List<EventCategory> categories = categoryService.getAllCategories();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("data", categories);
        return ResponseEntity.ok(body);
    }
}
