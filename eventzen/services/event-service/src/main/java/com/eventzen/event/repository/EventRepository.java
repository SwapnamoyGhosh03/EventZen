package com.eventzen.event.repository;

import com.eventzen.event.model.entity.Event;
import com.eventzen.event.model.enums.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, String> {

    Optional<Event> findByEventIdAndDeletedAtIsNull(String eventId);

    @Query("SELECT e FROM Event e WHERE e.deletedAt IS NULL " +
            "AND (:q IS NULL OR e.title LIKE %:q% OR e.description LIKE %:q%) " +
            "AND (:category IS NULL OR e.categoryId = :category) " +
            "AND (:status IS NULL OR e.status = :status) " +
            "AND (:city IS NULL OR e.city = :city) " +
            "AND (:organizerId IS NULL OR e.organizerId = :organizerId) " +
            "AND (:from IS NULL OR e.startDate >= :from) " +
            "AND (:to IS NULL OR e.endDate <= :to)")
    Page<Event> findAllWithFilters(
            @Param("q") String q,
            @Param("category") String category,
            @Param("status") EventStatus status,
            @Param("city") String city,
            @Param("organizerId") String organizerId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );

    @Query("SELECT e FROM Event e WHERE e.deletedAt IS NULL " +
            "AND (e.title LIKE %:query% OR e.description LIKE %:query% OR e.shortDescription LIKE %:query%)")
    Page<Event> searchEvents(@Param("query") String query, Pageable pageable);

    @Modifying
    @Query("UPDATE Event e SET e.currentRegistrations = COALESCE(e.currentRegistrations, 0) + 1 WHERE e.eventId = :eventId AND e.deletedAt IS NULL")
    int incrementCurrentRegistrations(@Param("eventId") String eventId);
}
