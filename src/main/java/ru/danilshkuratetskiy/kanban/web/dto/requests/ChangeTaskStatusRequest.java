package ru.danilshkuratetskiy.kanban.web.dto.requests;

import ru.danilshkuratetskiy.kanban.domain.model.TaskStatus;

import java.util.UUID;

public record ChangeTaskStatusRequest(
        TaskStatus status,
        UUID columnId
) {
}

