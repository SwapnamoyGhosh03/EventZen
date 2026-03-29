package com.eventzen.event.model.dto;

import com.eventzen.event.model.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {

    private String eventId;
    private String title;
    private String description;
    private String shortDescription;
    private String bannerUrl;
    private String organizerId;
    private String categoryId;
    private String categoryName;
    private EventStatus status;
    private String eventType;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String timezone;
    private String venueId;
    private String city;
    private String address;
    private Integer maxCapacity;
    private Integer currentRegistrations;
    private Boolean isRecurring;
    private String recurrenceRule;
    private Boolean isFree;
    private BigDecimal basePrice;
    private String currency;
    private List<String> tags;
    private List<String> imageUrls;
    private List<SessionResponse> sessions;
    private List<AgendaResponse> agendaItems;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionResponse {
        private String sessionId;
        private String title;
        private String description;
        private String speakerName;
        private String speakerId;
        private String room;
        private String sessionType;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Integer capacity;
        private Integer sortOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgendaResponse {
        private String agendaId;
        private String sessionId;
        private String title;
        private String description;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Integer sortOrder;
        private String type;
    }
}
