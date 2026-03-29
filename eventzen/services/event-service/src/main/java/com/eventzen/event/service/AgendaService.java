package com.eventzen.event.service;

import com.eventzen.event.exception.BusinessException;
import com.eventzen.event.exception.ResourceNotFoundException;
import com.eventzen.event.model.dto.AgendaReorderRequest;
import com.eventzen.event.model.dto.EventResponse;
import com.eventzen.event.model.entity.Event;
import com.eventzen.event.model.entity.EventAgenda;
import com.eventzen.event.repository.EventAgendaRepository;
import com.eventzen.event.repository.EventRepository;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgendaService {

    private final EventAgendaRepository agendaRepository;
    private final EventRepository eventRepository;

    @Transactional(readOnly = true)
    public List<EventResponse.AgendaResponse> getAgenda(String eventId) {
        eventRepository.findByEventIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId));

        return agendaRepository.findByEventIdOrderBySortOrderAsc(eventId).stream()
                .map(a -> EventResponse.AgendaResponse.builder()
                        .agendaId(a.getAgendaId())
                        .sessionId(a.getSessionId())
                        .title(a.getTitle())
                        .description(a.getDescription())
                        .startTime(a.getStartTime())
                        .endTime(a.getEndTime())
                        .sortOrder(a.getSortOrder())
                        .type(a.getType())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public List<EventResponse.AgendaResponse> reorderAgenda(String eventId, AgendaReorderRequest request, String callerId, boolean isAdmin) {
        Event event = eventRepository.findByEventIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId));

        if (!isAdmin && !event.getOrganizerId().equals(callerId)) {
            throw new AccessDeniedException("You are not authorized to reorder this event's agenda");
        }

        List<EventAgenda> agendaItems = agendaRepository.findByEventIdOrderBySortOrderAsc(eventId);
        Map<String, EventAgenda> agendaMap = agendaItems.stream()
                .collect(Collectors.toMap(EventAgenda::getAgendaId, Function.identity()));

        List<String> orderedIds = request.getOrderedAgendaIds();
        for (int i = 0; i < orderedIds.size(); i++) {
            EventAgenda item = agendaMap.get(orderedIds.get(i));
            if (item == null) {
                throw new BusinessException("Agenda item not found: " + orderedIds.get(i));
            }
            item.setSortOrder(i);
        }

        agendaRepository.saveAll(agendaItems);
        log.info("Agenda reordered for event: {}", eventId);

        return agendaRepository.findByEventIdOrderBySortOrderAsc(eventId).stream()
                .map(a -> EventResponse.AgendaResponse.builder()
                        .agendaId(a.getAgendaId())
                        .sessionId(a.getSessionId())
                        .title(a.getTitle())
                        .description(a.getDescription())
                        .startTime(a.getStartTime())
                        .endTime(a.getEndTime())
                        .sortOrder(a.getSortOrder())
                        .type(a.getType())
                        .build())
                .collect(Collectors.toList());
    }
}
