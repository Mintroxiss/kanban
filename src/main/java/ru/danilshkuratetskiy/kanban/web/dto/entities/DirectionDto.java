package ru.danilshkuratetskiy.kanban.web.dto.entities;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class DirectionDto {
    private UUID id;
    @NotBlank
    private String name;
    private String description;
}
