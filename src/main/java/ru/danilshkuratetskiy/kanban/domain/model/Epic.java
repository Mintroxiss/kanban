package ru.danilshkuratetskiy.kanban.domain.model;

import lombok.Data;

import java.util.UUID;

@Data
public class Epic {
    private UUID id;
    private String title;
    private String description;
    private UUID boardId;
    private UUID team_id;
}
