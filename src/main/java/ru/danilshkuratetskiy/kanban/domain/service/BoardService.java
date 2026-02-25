package ru.danilshkuratetskiy.kanban.domain.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import ru.danilshkuratetskiy.kanban.domain.model.Board;
import ru.danilshkuratetskiy.kanban.domain.model.Task;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface BoardService extends Service<Board> {

    Map<UUID, List<Task>> getBoardTasksGroupedByColumns(UUID boardId, UUID epicId);

    void archiveBoard(UUID id);

    void unarchiveBoard(UUID id);

    Page<Board> findAllArchived(Pageable pageable);
}
