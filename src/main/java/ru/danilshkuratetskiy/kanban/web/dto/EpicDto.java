package ru.danilshkuratetskiy.kanban.web.dto;

import lombok.Data;
import ru.danilshkuratetskiy.kanban.datasource.entity.BoardEntity;

import java.util.UUID;

@Data
public class EpicDto {
    private UUID id;
    private String title;
    private String description;
    private UUID boardId;
}