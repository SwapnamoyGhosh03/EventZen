package com.eventzen.event.util;

import com.eventzen.event.exception.BusinessException;
import com.eventzen.event.model.enums.EventStatus;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class EventStateMachine {

    private static final Map<EventStatus, Set<EventStatus>> TRANSITIONS = new EnumMap<>(EventStatus.class);

    static {
        // Any status can go back to DRAFT, plus specific forward transitions
        TRANSITIONS.put(EventStatus.DRAFT, new HashSet<>(EnumSet.of(EventStatus.PUBLISHED)));
        TRANSITIONS.put(EventStatus.PUBLISHED, new HashSet<>(EnumSet.of(EventStatus.REGISTRATION_OPEN, EventStatus.ARCHIVED, EventStatus.DRAFT)));
        TRANSITIONS.put(EventStatus.REGISTRATION_OPEN, new HashSet<>(EnumSet.of(EventStatus.ONGOING, EventStatus.ARCHIVED, EventStatus.DRAFT)));
        TRANSITIONS.put(EventStatus.ONGOING, new HashSet<>(EnumSet.of(EventStatus.COMPLETED, EventStatus.DRAFT)));
        TRANSITIONS.put(EventStatus.COMPLETED, new HashSet<>(EnumSet.of(EventStatus.ARCHIVED, EventStatus.DRAFT)));
        TRANSITIONS.put(EventStatus.ARCHIVED, new HashSet<>(EnumSet.of(EventStatus.DRAFT)));
    }

    public void validateTransition(EventStatus currentStatus, EventStatus targetStatus) {
        Set<EventStatus> allowedTransitions = TRANSITIONS.get(currentStatus);
        if (allowedTransitions == null || !allowedTransitions.contains(targetStatus)) {
            throw new BusinessException(
                    String.format("Invalid status transition from %s to %s", currentStatus, targetStatus));
        }
    }

    public Set<EventStatus> getAllowedTransitions(EventStatus currentStatus) {
        return TRANSITIONS.getOrDefault(currentStatus, Collections.emptySet());
    }
}
