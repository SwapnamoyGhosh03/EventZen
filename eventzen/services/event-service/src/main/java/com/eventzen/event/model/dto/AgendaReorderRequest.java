package com.eventzen.event.model.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgendaReorderRequest {

    @NotEmpty(message = "Ordered agenda IDs list must not be empty")
    private List<String> orderedAgendaIds;
}
