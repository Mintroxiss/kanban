package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.BoardEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.ColumnEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.EpicEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.TaskEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.BoardEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.mapper.TaskEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.BoardRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.ColumnRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.EpicRepository;
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
    private final EpicRepository epicRepository;
    private final TaskRepository taskRepository;
    private final TaskEntityMapper taskMapper;

    public BoardServiceImpl(
            BoardRepository boardRepository,
            BoardEntityMapper boardMapper,
            ColumnRepository columnRepository,
            EpicRepository epicRepository,
            TaskRepository taskRepository,
            TaskEntityMapper taskMapper
    ) {
        this.boardRepository = boardRepository;
        this.boardMapper = boardMapper;
        this.columnRepository = columnRepository;
        this.epicRepository = epicRepository;
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
    }

    @Override
    @Transactional
    public Board create(Board board) {
        BoardEntity entity = boardMapper.toEntity(board);
        BoardEntity saved = boardRepository.save(entity);

        // Создать три колонки по умолчанию для новой доски
        String[] defaultTitles = {"К выполнению", "В работе", "Готово"};
        for (int i = 0; i < defaultTitles.length; i++) {
            ColumnEntity col = new ColumnEntity();
            col.setBoardId(saved.getId());
            col.setTitle(defaultTitles[i]);
            col.setOrder(i + 1);
            columnRepository.save(col);
        }

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
        return boardRepository.findAllByArchivedFalse().stream()
                .map(boardMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Board> findAll(Pageable pageable) {
        return boardRepository.findAllByArchivedFalse(pageable).map(boardMapper::toDomain);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!boardRepository.existsById(id)) {
            throw new BoardNotFoundException("Board not found: " + id);
        }
        // Каскадное удаление: задачи → эпики → колонки → доска
        List<UUID> epicIds = epicRepository.findAllByBoardId(id).stream()
                .map(EpicEntity::getId).toList();
        if (!epicIds.isEmpty()) {
            taskRepository.deleteAllByEpicIdIn(epicIds);
        }
        epicRepository.deleteAllByBoardId(id);
        columnRepository.deleteAllByBoardId(id);
        boardRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void archiveBoard(UUID id) {
        BoardEntity entity = boardRepository.findById(id)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + id));
        entity.setArchived(true);
        boardRepository.save(entity);
    }

    @Override
    @Transactional
    public void unarchiveBoard(UUID id) {
        BoardEntity entity = boardRepository.findById(id)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + id));
        entity.setArchived(false);
        boardRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Board> findAllArchived(Pageable pageable) {
        return boardRepository.findAllByArchivedTrue(pageable).map(boardMapper::toDomain);
    }

    @Override
    @Transactional
    public Map<UUID, List<Task>> getBoardTasksGroupedByColumns(UUID boardId, UUID epicId) {
        List<ColumnEntity> columns = columnRepository.findAllByBoardIdOrderByOrder(boardId);
        List<UUID> columnIds = columns.stream().map(ColumnEntity::getId).toList();

        // Если указан эпик — фильтруем по нему; иначе показываем задачи только активных эпиков
        List<TaskEntity> tasks = (epicId != null)
                ? taskRepository.findAllByColumnIdInAndEpicId(columnIds, epicId)
                : taskRepository.findAllByColumnIdInAndEpicArchivedFalse(columnIds);

        return tasks.stream()
                .map(taskMapper::toDomain)
                .collect(Collectors.groupingBy(Task::getColumnId));
    }
}
