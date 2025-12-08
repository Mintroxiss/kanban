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

    private final TaskRepository taskRepository;
    private final TaskEntityMapper entityMapper;

    public TaskServiceImpl(TaskRepository taskRepository, TaskEntityMapper entityMapper) {
        this.taskRepository = taskRepository;
        this.entityMapper = entityMapper;
    }

    @Override
    @Transactional
    public Task create(Task task) {
        TaskEntity entity = entityMapper.toEntity(task);
        TaskEntity saved = taskRepository.save(entity);
        return entityMapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Task update(UUID id, Task task) {
        TaskEntity existing = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException("Task not found: " + id));
        existing.setTitle(task.getTitle());
        existing.setDescription(task.getDescription());
        existing.setStatus(task.getStatus());
        existing.setDeadline(task.getDeadline());
        existing.setAssigneeId(task.getAssigneeId());
        TaskEntity updated = taskRepository.save(existing);
        return entityMapper.toDomain(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Task findById(UUID id) {
        return taskRepository.findById(id)
                .map(entityMapper::toDomain)
                .orElseThrow(() -> new TaskNotFoundException("Task not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Task> findAll() {
        return taskRepository.findAll().stream()
                .map(entityMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!taskRepository.existsById(id)) {
            throw new TaskNotFoundException("Task not found: " + id);
        }
        taskRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Task> findByStatus(TaskStatus status) {
        return taskRepository.findAll().stream()
                .map(entityMapper::toDomain)
                .filter(t -> t.getStatus() == status)
                .collect(Collectors.toList());
    }
}
