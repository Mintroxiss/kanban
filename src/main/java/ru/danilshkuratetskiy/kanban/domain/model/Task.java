package ru.danilshkuratetskiy.kanban.domain.model;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class Task {
    private UUID id;
    private String title;
    private String description;
    private TaskStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDate deadline;
    private UUID assigneeId;
    private UUID lastAssigneeId;
    private UUID columnId;
    private UUID epicId;
}

