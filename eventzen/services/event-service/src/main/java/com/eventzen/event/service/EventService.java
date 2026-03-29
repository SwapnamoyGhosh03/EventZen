package com.eventzen.event.service;

import com.eventzen.event.exception.BusinessException;
import com.eventzen.event.exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import com.eventzen.event.kafka.EventKafkaProducer;
import com.eventzen.event.model.dto.*;
import com.eventzen.event.model.entity.Event;
import com.eventzen.event.model.entity.EventTag;
import com.eventzen.event.model.enums.EventStatus;
import com.eventzen.event.repository.EventRepository;
import com.eventzen.event.util.EventStateMachine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventKafkaProducer kafkaProducer;
    private final EventStateMachine stateMachine;

    @Transactional
    public EventResponse createEvent(CreateEventRequest request, String organizerId) {
        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .shortDescription(request.getShortDescription())
                .bannerUrl(request.getBannerUrl())
                .organizerId(organizerId)
                .categoryId(request.getCategoryId())
                .eventType(request.getEventType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .timezone(request.getTimezone())
                .venueId(request.getVenueId())
                .city(request.getCity())
                .address(request.getAddress())
                .maxCapacity(request.getMaxCapacity())
                .isRecurring(request.getIsRecurring())
                .recurrenceRule(request.getRecurrenceRule())
                .isFree(request.getIsFree())
                .basePrice(request.getBasePrice())
                .currency(request.getCurrency())
                .imageUrls(request.getImageUrls())
                .status(EventStatus.DRAFT)
                .build();

        Event saved = eventRepository.save(event);

        // Save tags
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            List<EventTag> tags = request.getTags().stream()
                    .map(tagName -> EventTag.builder()
                            .event(saved)
                            .tagName(tagName)
                            .build())
                    .collect(Collectors.toList());
            saved.setEventTags(tags);
            eventRepository.save(saved);
        }

        kafkaProducer.publishEventCreated(saved.getEventId(), saved.getTitle(), saved.getOrganizerId());
        log.info("Event created: {} by organizer: {}", saved.getEventId(), organizerId);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> listEvents(String q, String category, EventStatus status, String city,
                                           String organizerId, LocalDateTime from, LocalDateTime to,
                                           int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Event> events = eventRepository.findAllWithFilters(q, category, status, city, organizerId, from, to, pageable);
        return events.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public EventResponse getEvent(String eventId) {
        Event event = findEventOrThrow(eventId);
        return mapToDetailedResponse(event);
    }

    @Transactional
    public EventResponse updateEvent(String eventId, UpdateEventRequest request, String callerId, boolean isAdmin) {
        Event event = findEventOrThrow(eventId);

        if (!isAdmin && !event.getOrganizerId().equals(callerId)) {
            throw new AccessDeniedException("You are not authorized to edit this event");
        }

        if (request.getTitle() != null) event.setTitle(request.getTitle());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getShortDescription() != null) event.setShortDescription(request.getShortDescription());
        if (request.getBannerUrl() != null) event.setBannerUrl(request.getBannerUrl());
        if (request.getImageUrls() != null) event.setImageUrls(request.getImageUrls());
        if (request.getCategoryId() != null) event.setCategoryId(request.getCategoryId());
        if (request.getEventType() != null) event.setEventType(request.getEventType());
        if (request.getStartDate() != null) event.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) event.setEndDate(request.getEndDate());
        if (request.getTimezone() != null) event.setTimezone(request.getTimezone());
        if (request.getVenueId() != null) event.setVenueId(request.getVenueId());
        if (request.getCity() != null) event.setCity(request.getCity());
        if (request.getAddress() != null) event.setAddress(request.getAddress());
        if (request.getMaxCapacity() != null) event.setMaxCapacity(request.getMaxCapacity());
        if (request.getIsRecurring() != null) event.setIsRecurring(request.getIsRecurring());
        if (request.getRecurrenceRule() != null) event.setRecurrenceRule(request.getRecurrenceRule());
        if (request.getIsFree() != null) event.setIsFree(request.getIsFree());
        if (request.getBasePrice() != null) event.setBasePrice(request.getBasePrice());
        if (request.getCurrency() != null) event.setCurrency(request.getCurrency());

        if (request.getTags() != null) {
            event.getEventTags().clear();
            List<EventTag> newTags = request.getTags().stream()
                    .map(tagName -> EventTag.builder()
                            .event(event)
                            .tagName(tagName)
                            .build())
                    .collect(Collectors.toList());
            event.getEventTags().addAll(newTags);
        }

        Event updated = eventRepository.save(event);
        kafkaProducer.publishEventUpdated(updated.getEventId(), updated.getTitle(), updated.getOrganizerId());
        log.info("Event updated: {}", eventId);

        return mapToResponse(updated);
    }

    @Transactional
    public EventResponse changeStatus(String eventId, EventStatus newStatus) {
        Event event = findEventOrThrow(eventId);
        EventStatus oldStatus = event.getStatus();

        stateMachine.validateTransition(oldStatus, newStatus);

        event.setStatus(newStatus);
        Event updated = eventRepository.save(event);

        kafkaProducer.publishEventStatusChanged(eventId, oldStatus.name(), newStatus.name(), updated.getOrganizerId());
        log.info("Event {} status changed: {} -> {}", eventId, oldStatus, newStatus);

        return mapToResponse(updated);
    }

    @Transactional
    public void softDelete(String eventId) {
        Event event = findEventOrThrow(eventId);
        event.setDeletedAt(LocalDateTime.now());
        eventRepository.save(event);
        kafkaProducer.publishEventDeleted(eventId, event.getOrganizerId());
        log.info("Event soft deleted: {}", eventId);
    }

    @Transactional(readOnly = true)
    public Page<EventSearchResponse> searchEvents(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Event> events = eventRepository.searchEvents(query, pageable);
        return events.map(this::mapToSearchResponse);
    }

    private Event findEventOrThrow(String eventId) {
        return eventRepository.findByEventIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId));
    }

    private EventResponse mapToResponse(Event event) {
        List<String> tags = event.getEventTags() != null
                ? event.getEventTags().stream().map(EventTag::getTagName).collect(Collectors.toList())
                : new ArrayList<>();

        return EventResponse.builder()
                .eventId(event.getEventId())
                .title(event.getTitle())
                .description(event.getDescription())
                .shortDescription(event.getShortDescription())
                .bannerUrl(event.getBannerUrl())
                .organizerId(event.getOrganizerId())
                .categoryId(event.getCategoryId())
                .categoryName(event.getCategory() != null ? event.getCategory().getCategoryName() : null)
                .status(event.getStatus())
                .eventType(event.getEventType())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .timezone(event.getTimezone())
                .venueId(event.getVenueId())
                .city(event.getCity())
                .address(event.getAddress())
                .maxCapacity(event.getMaxCapacity())
                .currentRegistrations(event.getCurrentRegistrations())
                .isRecurring(event.getIsRecurring())
                .recurrenceRule(event.getRecurrenceRule())
                .isFree(event.getIsFree())
                .basePrice(event.getBasePrice())
                .currency(event.getCurrency())
                .tags(tags)
                .imageUrls(event.getImageUrls())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    private EventResponse mapToDetailedResponse(Event event) {
        EventResponse response = mapToResponse(event);

        if (event.getSessions() != null) {
            List<EventResponse.SessionResponse> sessions = event.getSessions().stream()
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
            response.setSessions(sessions);
        }

        if (event.getAgendaItems() != null) {
            List<EventResponse.AgendaResponse> agendaItems = event.getAgendaItems().stream()
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
            response.setAgendaItems(agendaItems);
        }

        return response;
    }

    private EventSearchResponse mapToSearchResponse(Event event) {
        List<String> tags = event.getEventTags() != null
                ? event.getEventTags().stream().map(EventTag::getTagName).collect(Collectors.toList())
                : new ArrayList<>();

        return EventSearchResponse.builder()
                .eventId(event.getEventId())
                .title(event.getTitle())
                .shortDescription(event.getShortDescription())
                .bannerUrl(event.getBannerUrl())
                .organizerId(event.getOrganizerId())
                .categoryName(event.getCategory() != null ? event.getCategory().getCategoryName() : null)
                .status(event.getStatus())
                .eventType(event.getEventType())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .city(event.getCity())
                .maxCapacity(event.getMaxCapacity())
                .currentRegistrations(event.getCurrentRegistrations())
                .isFree(event.getIsFree())
                .basePrice(event.getBasePrice())
                .currency(event.getCurrency())
                .tags(tags)
                .build();
    }
}
