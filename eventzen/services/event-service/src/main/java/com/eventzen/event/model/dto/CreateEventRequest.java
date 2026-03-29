package com.eventzen.event.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class CreateEventRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;

    @Size(max = 500, message = "Short description must not exceed 500 characters")
    private String shortDescription;

    private String bannerUrl;

    private String categoryId;

    private String eventType;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private String timezone;

    private String venueId;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    private String address;

    private Integer maxCapacity;

    private Boolean isRecurring;

    private String recurrenceRule;

    private Boolean isFree;

    private BigDecimal basePrice;

    private String currency;

    private List<String> tags;

    private List<String> imageUrls;
}
