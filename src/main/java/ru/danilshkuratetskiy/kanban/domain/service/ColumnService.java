package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.Column;

import java.util.List;
import java.util.UUID;

public interface ColumnService extends Service<Column> {

    List<Column> findByBoard(UUID boardId);
}
