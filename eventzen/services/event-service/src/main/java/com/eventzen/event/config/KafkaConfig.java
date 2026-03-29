package com.eventzen.event.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    public static final String EVENT_CREATED_TOPIC = "event.created";
    public static final String EVENT_UPDATED_TOPIC = "event.updated";
    public static final String EVENT_STATUS_CHANGED_TOPIC = "event.status.changed";
    public static final String EVENT_DELETED_TOPIC = "event.deleted";
    public static final String REGISTRATION_CONFIRMED_TOPIC = "registration.confirmed";

    @Bean
    public NewTopic eventCreatedTopic() {
        return TopicBuilder.name(EVENT_CREATED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic eventUpdatedTopic() {
        return TopicBuilder.name(EVENT_UPDATED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic eventStatusChangedTopic() {
        return TopicBuilder.name(EVENT_STATUS_CHANGED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic eventDeletedTopic() {
        return TopicBuilder.name(EVENT_DELETED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
