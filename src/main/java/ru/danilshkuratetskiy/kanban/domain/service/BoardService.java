package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.Board;
import ru.danilshkuratetskiy.kanban.domain.model.Task;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface BoardService extends Service<Board> {

    Map<UUID, List<Task>> getBoardTasksGroupedByColumns(UUID boardId);
}
