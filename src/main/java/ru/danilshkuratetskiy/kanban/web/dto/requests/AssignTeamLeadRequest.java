package ru.danilshkuratetskiy.kanban.web.dto.requests;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignTeamLeadRequest(@NotNull UUID userId) {
}
