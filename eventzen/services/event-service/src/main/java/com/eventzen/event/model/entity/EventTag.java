package com.eventzen.event.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "event_tags")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "event")
@EqualsAndHashCode(exclude = "event")
public class EventTag {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "event_id", length = 36, nullable = false, insertable = false, updatable = false)
    private String eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "tag_name", length = 50, nullable = false)
    private String tagName;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
