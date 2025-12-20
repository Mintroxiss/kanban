package ru.danilshkuratetskiy.kanban.web.dto.entities;

import lombok.Data;

import java.util.UUID;

@Data
public class TeamDto {
    private UUID id;
    private String name;
    private UUID directionId;
    private UUID teamLeadId;
}
