package com.eventzen.event.service;

import com.eventzen.event.exception.BusinessException;
import com.eventzen.event.exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import com.eventzen.event.model.dto.CreateSessionRequest;
import com.eventzen.event.model.dto.EventResponse;
import com.eventzen.event.model.entity.Event;
import com.eventzen.event.model.entity.EventSession;
import com.eventzen.event.repository.EventRepository;
import com.eventzen.event.repository.EventSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventSessionService {

    private final EventSessionRepository sessionRepository;
    private final EventRepository eventRepository;

    @Transactional
    public EventResponse.SessionResponse addSession(String eventId, CreateSessionRequest request, String callerId, boolean isAdmin) {
        Event event = eventRepository.findByEventIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId));

        if (!isAdmin && !event.getOrganizerId().equals(callerId)) {
            throw new AccessDeniedException("You are not authorized to add sessions to this event");
        }

        // Validate no time conflict in same room
        if (request.getRoom() != null && request.getStartTime() != null && request.getEndTime() != null) {
            List<EventSession> conflicts = sessionRepository.findConflictingSessions(
                    eventId, request.getRoom(), request.getStartTime(), request.getEndTime());
            if (!conflicts.isEmpty()) {
                throw new BusinessException("Time conflict: room '" + request.getRoom() +
                        "' is already booked during the requested time slot");
            }
        }

        EventSession session = EventSession.builder()
                .event(event)
                .title(request.getTitle())
                .description(request.getDescription())
                .speakerName(request.getSpeakerName())
                .speakerId(request.getSpeakerId())
                .room(request.getRoom())
                .sessionType(request.getSessionType())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .capacity(request.getCapacity())
                .sortOrder(request.getSortOrder())
                .build();

        EventSession saved = sessionRepository.save(session);
        log.info("Session added to event {}: {}", eventId, saved.getSessionId());

        return EventResponse.SessionResponse.builder()
                .sessionId(saved.getSessionId())
                .title(saved.getTitle())
                .description(saved.getDescription())
                .speakerName(saved.getSpeakerName())
                .speakerId(saved.getSpeakerId())
                .room(saved.getRoom())
                .sessionType(saved.getSessionType())
                .startTime(saved.getStartTime())
                .endTime(saved.getEndTime())
                .capacity(saved.getCapacity())
                .sortOrder(saved.getSortOrder())
                .build();
    }

    @Transactional(readOnly = true)
    public List<EventResponse.SessionResponse> getSessions(String eventId) {
        return sessionRepository.findByEventIdOrderBySortOrderAsc(eventId).stream()
                .map(s -> EventResponse.SessionResponse.builder()
                        .sessionId(s.getSessionId())
                        .title(s.getTitle())
                        .description(s.getDescription())
                        .speakerName(s.getSpeakerName())
                        .speakerId(s.getSpeakerId())
                        .room(s.getRoom())
                        .sessionType(s.getSessionType())
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .capacity(s.getCapacity())
                        .sortOrder(s.getSortOrder())
                        .build())
                .collect(Collectors.toList());
    }
}
