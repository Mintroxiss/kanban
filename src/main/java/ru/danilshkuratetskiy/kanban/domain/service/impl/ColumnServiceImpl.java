package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.ColumnEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.TaskEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.ColumnEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.ColumnRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.EpicRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.TaskRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Column;
import ru.danilshkuratetskiy.kanban.domain.service.ColumnService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.BusinessException;
import ru.danilshkuratetskiy.kanban.domain.service.exception.ColumnNotFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ColumnServiceImpl implements ColumnService {

    private final ColumnRepository repository;
    private final ColumnEntityMapper mapper;
    private final TaskRepository taskRepository;
    private final EpicRepository epicRepository;

    public ColumnServiceImpl(ColumnRepository repository, ColumnEntityMapper mapper, TaskRepository taskRepository, EpicRepository epicRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.taskRepository = taskRepository;
        this.epicRepository = epicRepository;
    }

    @Override
    @Transactional
    public Column create(Column column) {
        ColumnEntity entity = mapper.toEntity(column);
        ColumnEntity saved = repository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Column update(UUID id, Column column) {
        ColumnEntity existing = repository.findById(id)
                .orElseThrow(() -> new ColumnNotFoundException("Column not found: " + id));
        existing.setTitle(column.getTitle());
        existing.setBoardId(column.getBoardId());
        existing.setOrder(column.getOrder());
        ColumnEntity updated = repository.save(existing);
        return mapper.toDomain(updated);
    }

    @Override
    @Transactional
    public Column findById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDomain)
                .orElseThrow(() -> new ColumnNotFoundException("Column not found: " + id));
    }

    @Override
    @Transactional
    public List<Column> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Column> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Column> findByBoard(UUID boardId) {
        return repository.findAllByBoardIdOrderByOrder(boardId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ColumnNotFoundException("Column not found: " + id);
        }
        List<TaskEntity> all = taskRepository.findAllByColumnId(id);
        if (!all.isEmpty()) {
            Set<UUID> epicIds = all.stream()
                    .map(TaskEntity::getEpicId)
                    .collect(Collectors.toSet());
            Set<UUID> archivedIds = epicRepository.findArchivedIdsByIdIn(new ArrayList<>(epicIds));
            boolean hasActiveTasks = all.stream().anyMatch(t -> !archivedIds.contains(t.getEpicId()));
            if (hasActiveTasks) {
                throw new BusinessException("Нельзя удалить столбец: сначала удалите все задачи из него");
            }
            all.forEach(t -> t.setColumnId(null));
            taskRepository.saveAll(all);
        }
        repository.deleteById(id);
    }
}
