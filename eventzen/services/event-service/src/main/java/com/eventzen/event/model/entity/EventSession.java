package com.eventzen.event.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "event_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "event")
@EqualsAndHashCode(exclude = "event")
public class EventSession {

    @Id
    @Column(name = "session_id", length = 36)
    private String sessionId;

    @Column(name = "event_id", length = 36, nullable = false, insertable = false, updatable = false)
    private String eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "speaker_name", length = 200)
    private String speakerName;

    @Column(name = "speaker_id", length = 36)
    private String speakerId;

    @Column(name = "room", length = 100)
    private String room;

    @Column(name = "session_type", length = 100)
    private String sessionType;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.sessionId == null) {
            this.sessionId = UUID.randomUUID().toString();
        }
        if (this.capacity == null) {
            this.capacity = 0;
        }
        if (this.sortOrder == null) {
            this.sortOrder = 0;
        }
    }
}
