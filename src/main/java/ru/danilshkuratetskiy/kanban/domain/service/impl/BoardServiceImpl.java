package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.BoardEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.ColumnEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.TaskEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.BoardEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.mapper.TaskEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.BoardRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.ColumnRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.TaskRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Board;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.service.BoardService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.BoardNotFoundException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BoardServiceImpl implements BoardService {

    private final BoardRepository boardRepository;
    private final BoardEntityMapper boardMapper;

    private final ColumnRepository columnRepository;
    private final TaskRepository taskRepository;
    private final TaskEntityMapper taskMapper;

    public BoardServiceImpl(
            BoardRepository boardRepository,
            BoardEntityMapper boardMapper,
            ColumnRepository columnRepository,
            TaskRepository taskRepository,
            TaskEntityMapper taskMapper
    ) {
        this.boardRepository = boardRepository;
        this.boardMapper = boardMapper;
        this.columnRepository = columnRepository;
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
    }

    @Override
    @Transactional
    public Board create(Board board) {
        BoardEntity entity = boardMapper.toEntity(board);
        BoardEntity saved = boardRepository.save(entity);
        return boardMapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Board update(UUID id, Board board) {
        BoardEntity existing = boardRepository.findById(id)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + id));
        existing.setName(board.getName());
        existing.setDirectionId(board.getDirectionId());
        BoardEntity updated = boardRepository.save(existing);
        return boardMapper.toDomain(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Board findById(UUID id) {
        return boardRepository.findById(id)
                .map(boardMapper::toDomain)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Board> findAll() {
        return boardRepository.findAll().stream()
                .map(boardMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!boardRepository.existsById(id)) {
            throw new BoardNotFoundException("Board not found: " + id);
        }
        boardRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Map<UUID, List<Task>> getBoardTasksGroupedByColumns(UUID boardId) {
        List<ColumnEntity> columns = columnRepository.findAllByBoardIdOrderByOrder(boardId);
        List<UUID> columnIds = columns.stream().map(ColumnEntity::getId).toList();

        List<TaskEntity> tasks = taskRepository.findAllByColumnIdIn(columnIds);

        return tasks.stream()
                .map(taskMapper::toDomain)
                .collect(Collectors.groupingBy(Task::getColumnId));
    }
}
