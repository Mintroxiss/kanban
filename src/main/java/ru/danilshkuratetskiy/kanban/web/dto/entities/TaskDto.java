package ru.danilshkuratetskiy.kanban.web.dto.entities;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class TaskDto {
    private UUID id;
    @NotBlank
    private String title;
    private String description;
    @NotBlank
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @NotNull
    private LocalDate deadline;
    private UUID assigneeId;
    private String assigneeName;
    private UUID lastAssigneeId;
    private String lastAssigneeName;
    private UUID columnId;
    @NotNull
    private UUID epicId;
}
