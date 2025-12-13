package ru.danilshkuratetskiy.kanban.web.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class TaskDto {
    private UUID id;
    private String title;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDate deadline;
    private UUID assigneeId;
    private UUID columnId;
    private UUID epicId;
}
