package ru.danilshkuratetskiy.kanban.web.dto.entities;

import lombok.Data;

import java.util.UUID;

@Data
public class ColumnDto {
    private UUID id;
    private String title;
    private UUID boardId;
    private Integer order;
}