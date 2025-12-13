package ru.danilshkuratetskiy.kanban.web.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class DirectionDto {
    private UUID id;
    private String name;
    private String description;
}
