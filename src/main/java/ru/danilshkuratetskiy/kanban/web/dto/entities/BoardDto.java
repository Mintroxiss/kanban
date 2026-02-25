package ru.danilshkuratetskiy.kanban.web.dto.entities;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class BoardDto {
    private UUID id;
    @NotBlank
    private String name;
    @NotNull
    private UUID directionId;
    private boolean archived;
}
