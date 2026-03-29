package com.eventzen.event.repository;

import com.eventzen.event.model.entity.EventCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventCategoryRepository extends JpaRepository<EventCategory, String> {

    List<EventCategory> findAllByOrderBySortOrderAsc();
}
