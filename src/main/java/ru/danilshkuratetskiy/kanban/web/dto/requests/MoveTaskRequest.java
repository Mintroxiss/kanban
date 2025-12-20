package ru.danilshkuratetskiy.kanban.web.dto.requests;

import java.util.UUID;

public record MoveTaskRequest(UUID columnId) {
}
