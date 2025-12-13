package ru.danilshkuratetskiy.kanban.domain.model;

import lombok.Data;

import java.util.UUID;

@Data
public class Team {
    private UUID id;
    private String name;
    private UUID directionId;
    private UUID teamLeadId;
}
