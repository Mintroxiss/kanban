package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.TaskEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.TaskEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.TaskRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.TaskStatus;
import ru.danilshkuratetskiy.kanban.domain.service.TaskService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.TaskNotFoundException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository repository;
    private final TaskEntityMapper mapper;

    public TaskServiceImpl(TaskRepository repository, TaskEntityMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public Task create(Task task) {
        TaskEntity entity = mapper.toEntity(task);
        TaskEntity saved = repository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Task update(UUID id, Task task) {
        TaskEntity existing = repository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException("Task not found: " + id));
        existing.setTitle(task.getTitle());
        existing.setDescription(task.getDescription());
        existing.setStatus(task.getStatus());
        existing.setDeadline(task.getDeadline());
        existing.setAssigneeId(task.getAssigneeId());
        existing.setColumnId(task.getColumnId());
        existing.setEpicId(task.getEpicId());
        TaskEntity updated = repository.save(existing);
        return mapper.toDomain(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Task findById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDomain)
                .orElseThrow(() -> new TaskNotFoundException("Task not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Task> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new TaskNotFoundException("Task not found: " + id);
        }
        repository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Task> findByStatus(TaskStatus status) {
        return repository.findAll().stream()
                .map(mapper::toDomain)
                .filter(t -> t.getStatus() == status)
                .collect(Collectors.toList());
    }
}
