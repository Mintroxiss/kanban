package ru.danilshkuratetskiy.kanban.websocket;

import ru.danilshkuratetskiy.kanban.web.dto.entities.TaskDto;

public record BoardEvent(String type, TaskDto payload) {}
