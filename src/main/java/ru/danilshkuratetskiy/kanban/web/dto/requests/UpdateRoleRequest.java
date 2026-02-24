package ru.danilshkuratetskiy.kanban.web.dto.requests;

import jakarta.validation.constraints.NotNull;
import ru.danilshkuratetskiy.kanban.domain.model.UserRole;

public record UpdateRoleRequest(@NotNull UserRole role) {}
