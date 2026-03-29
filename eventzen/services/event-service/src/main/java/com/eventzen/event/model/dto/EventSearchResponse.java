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
public class EventSearchResponse {

    private String eventId;
    private String title;
    private String shortDescription;
    private String bannerUrl;
    private String organizerId;
    private String categoryName;
    private EventStatus status;
    private String eventType;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String city;
    private Integer maxCapacity;
    private Integer currentRegistrations;
    private Boolean isFree;
    private BigDecimal basePrice;
    private String currency;
    private List<String> tags;
}
