package com.eventzen.event.kafka;

import com.eventzen.event.repository.EventRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class RegistrationConfirmedConsumer {

    private final EventRepository eventRepository;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "registration.confirmed", groupId = "event-service")
    @Transactional
    public void onRegistrationConfirmed(String message) {
        try {
            JsonNode node = objectMapper.readTree(message);
            String eventId = node.path("eventId").asText(null);

            if (eventId == null || eventId.isBlank()) {
                log.warn("registration.confirmed missing eventId: {}", message);
                return;
            }

            int updated = eventRepository.incrementCurrentRegistrations(eventId);
            if (updated > 0) {
                log.info("Incremented currentRegistrations for event {}", eventId);
            } else {
                log.warn("No event found for id {} when processing registration.confirmed", eventId);
            }
        } catch (Exception ex) {
            log.error("Failed to process registration.confirmed: {}", ex.getMessage(), ex);
        }
    }
}
