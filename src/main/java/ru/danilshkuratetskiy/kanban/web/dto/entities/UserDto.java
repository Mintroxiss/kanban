package ru.danilshkuratetskiy.kanban.web.dto.entities;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import ru.danilshkuratetskiy.kanban.domain.model.UserRole;

import java.util.UUID;

@Data
public class UserDto {
    private UUID id;
    @NotBlank
    private String fullName;
    private UUID teamId;
    @NotBlank
    @Email
    private String email;
    @NotNull
    private UserRole role;
}