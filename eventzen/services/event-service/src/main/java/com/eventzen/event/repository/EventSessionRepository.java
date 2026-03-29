package com.eventzen.event.repository;

import com.eventzen.event.model.entity.EventSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventSessionRepository extends JpaRepository<EventSession, String> {

    List<EventSession> findByEventIdOrderBySortOrderAsc(String eventId);

    @Query("SELECT s FROM EventSession s WHERE s.eventId = :eventId " +
            "AND s.room = :room " +
            "AND ((s.startTime < :endTime AND s.endTime > :startTime))")
    List<EventSession> findConflictingSessions(
            @Param("eventId") String eventId,
            @Param("room") String room,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}
