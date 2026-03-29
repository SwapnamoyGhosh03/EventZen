package com.eventzen.event.service;

import com.eventzen.event.model.entity.EventCategory;
import com.eventzen.event.repository.EventCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final EventCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<EventCategory> getAllCategories() {
        return categoryRepository.findAllByOrderBySortOrderAsc();
    }
}
