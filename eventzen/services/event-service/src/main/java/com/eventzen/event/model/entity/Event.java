package com.eventzen.event.model.entity;

import com.eventzen.event.model.enums.EventStatus;
import com.eventzen.event.util.StringListConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"sessions", "agendaItems", "eventTags", "category"})
@EqualsAndHashCode(exclude = {"sessions", "agendaItems", "eventTags", "category"})
public class Event {

    @Id
    @Column(name = "event_id", length = 36)
    private String eventId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Convert(converter = StringListConverter.class)
    @Column(name = "image_urls", columnDefinition = "LONGTEXT")
    private List<String> imageUrls;

    @Column(name = "organizer_id", length = 36, nullable = false)
    private String organizerId;

    @Column(name = "category_id", length = 36)
    private String categoryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private EventStatus status;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "timezone", length = 50)
    private String timezone;

    @Column(name = "venue_id", length = 36)
    private String venueId;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "max_capacity")
    private Integer maxCapacity;

    @Column(name = "current_registrations")
    private Integer currentRegistrations;

    @Column(name = "is_recurring")
    private Boolean isRecurring;

    @Column(name = "recurrence_rule")
    private String recurrenceRule;

    @Column(name = "is_free")
    private Boolean isFree;

    @Column(name = "base_price", precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "currency", length = 3)
    private String currency;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EventSession> sessions = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EventAgenda> agendaItems = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EventTag> eventTags = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", insertable = false, updatable = false)
    private EventCategory category;

    @PrePersist
    public void prePersist() {
        if (this.eventId == null) {
            this.eventId = UUID.randomUUID().toString();
        }
        if (this.status == null) {
            this.status = EventStatus.DRAFT;
        }
        if (this.currency == null) {
            this.currency = "INR";
        }
        if (this.timezone == null) {
            this.timezone = "UTC";
        }
        if (this.maxCapacity == null) {
            this.maxCapacity = 0;
        }
        if (this.currentRegistrations == null) {
            this.currentRegistrations = 0;
        }
        if (this.isRecurring == null) {
            this.isRecurring = false;
        }
        if (this.isFree == null) {
            this.isFree = true;
        }
        if (this.basePrice == null) {
            this.basePrice = BigDecimal.ZERO;
        }
    }
}
