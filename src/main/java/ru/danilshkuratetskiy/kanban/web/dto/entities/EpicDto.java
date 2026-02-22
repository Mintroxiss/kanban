package ru.danilshkuratetskiy.kanban.web.dto.entities;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class EpicDto {
    private UUID id;
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private UUID boardId;
    private UUID teamId;
}