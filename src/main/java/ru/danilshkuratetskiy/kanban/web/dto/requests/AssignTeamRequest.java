package ru.danilshkuratetskiy.kanban.web.dto.requests;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignTeamRequest(@NotNull UUID teamId) {
}
