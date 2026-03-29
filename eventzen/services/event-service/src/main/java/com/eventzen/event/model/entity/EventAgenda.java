package com.eventzen.event.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "event_agenda")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "event")
@EqualsAndHashCode(exclude = "event")
public class EventAgenda {

    @Id
    @Column(name = "agenda_id", length = 36)
    private String agendaId;

    @Column(name = "event_id", length = 36, nullable = false, insertable = false, updatable = false)
    private String eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "session_id", length = 36)
    private String sessionId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "type")
    private String type;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.agendaId == null) {
            this.agendaId = UUID.randomUUID().toString();
        }
        if (this.sortOrder == null) {
            this.sortOrder = 0;
        }
        if (this.type == null) {
            this.type = "SESSION";
        }
    }
}
