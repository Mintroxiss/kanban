package ru.danilshkuratetskiy.kanban.web.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class EpicDto {
    private UUID id;
    private String title;
    private String description;
    private UUID boardId;
    private UUID teamId;
}