package ru.danilshkuratetskiy.kanban.web.dto.entities;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ColumnDto {
    private UUID id;
    @NotBlank
    private String title;
    @NotNull
    private UUID boardId;
    @NotNull
    private Integer order;
}