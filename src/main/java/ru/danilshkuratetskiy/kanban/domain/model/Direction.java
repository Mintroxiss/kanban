package ru.danilshkuratetskiy.kanban.domain.model;

import lombok.Data;

import java.util.UUID;

@Data
public class Direction {
    private UUID id;
    private String name;
    private String description;
}
