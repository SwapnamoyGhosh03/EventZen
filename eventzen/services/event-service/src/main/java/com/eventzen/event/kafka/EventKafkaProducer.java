package com.eventzen.event.kafka;

import com.eventzen.event.config.KafkaConfig;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventKafkaProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    public void publishEventCreated(String eventId, String title, String organizerId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventId", eventId);
        payload.put("title", title);
        payload.put("organizerId", organizerId);
        payload.put("action", "CREATED");
        publish(KafkaConfig.EVENT_CREATED_TOPIC, eventId, payload);
    }

    public void publishEventUpdated(String eventId, String title, String organizerId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventId", eventId);
        payload.put("title", title);
        payload.put("organizerId", organizerId);
        payload.put("action", "UPDATED");
        publish(KafkaConfig.EVENT_UPDATED_TOPIC, eventId, payload);
    }

    public void publishEventStatusChanged(String eventId, String oldStatus, String newStatus, String organizerId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventId", eventId);
        payload.put("oldStatus", oldStatus);
        payload.put("newStatus", newStatus);
        payload.put("organizerId", organizerId);
        payload.put("action", "STATUS_CHANGED");
        publish(KafkaConfig.EVENT_STATUS_CHANGED_TOPIC, eventId, payload);
    }

    public void publishEventDeleted(String eventId, String organizerId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventId", eventId);
        payload.put("organizerId", organizerId);
        payload.put("action", "DELETED");
        publish(KafkaConfig.EVENT_DELETED_TOPIC, eventId, payload);
    }

    private void publish(String topic, String key, Map<String, Object> payload) {
        try {
            String message = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(topic, key, message);
            log.info("Published to topic {}: {}", topic, message);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize Kafka message for topic {}: {}", topic, e.getMessage());
        } catch (Exception e) {
            log.warn("Kafka unavailable — skipping publish to topic {}: {}", topic, e.getMessage());
        }
    }
}
