package ru.danilshkuratetskiy.kanban.web.dto.entities;

import lombok.Data;
import ru.danilshkuratetskiy.kanban.domain.model.UserRole;

import java.util.UUID;

@Data
public class UserDto {
    private UUID id;
    private String fullName;
    private UUID teamId;
    private String email;
    private UserRole role;
}