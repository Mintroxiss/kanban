package ru.danilshkuratetskiy.kanban.web.dto.requests;

import jakarta.validation.constraints.NotNull;
import ru.danilshkuratetskiy.kanban.domain.model.TaskStatus;

import java.util.UUID;

public record ChangeTaskStatusRequest(
        @NotNull TaskStatus status,
        UUID columnId
) {
}

