package com.eventzen.event.repository;

import com.eventzen.event.model.entity.EventAgenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventAgendaRepository extends JpaRepository<EventAgenda, String> {

    List<EventAgenda> findByEventIdOrderBySortOrderAsc(String eventId);
}
