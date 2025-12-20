package ru.danilshkuratetskiy.kanban.web.dto.entities;

import lombok.Data;

import java.util.UUID;

@Data
public class BoardDto {
    private UUID id;
    private String name;
    private UUID directionId;
}
