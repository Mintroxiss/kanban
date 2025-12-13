package ru.danilshkuratetskiy.kanban.domain.model;

import lombok.Data;

import java.util.UUID;

@Data
public class Column {
    private UUID id;
    private String title;
    private UUID boardId;
    private Integer order;
}
