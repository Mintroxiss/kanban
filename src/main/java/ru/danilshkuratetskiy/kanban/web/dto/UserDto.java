package ru.danilshkuratetskiy.kanban.web.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class UserDto {
    private UUID id;
    private String fullName;
    private UUID teamId;
}