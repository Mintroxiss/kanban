package ru.danilshkuratetskiy.kanban.domain.model;

import lombok.Data;

import java.util.UUID;

@Data
public class User {
    private UUID id;
    private String fullName;
    private UUID teamId;
}
