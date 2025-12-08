package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.TaskStatus;

import java.util.List;
import java.util.UUID;

public interface TaskService {
    Task create(Task task);
    Task update(UUID id, Task task);
    Task findById(UUID id);
    List<Task> findAll();
    void delete(UUID id);
    List<Task> findByStatus(TaskStatus status);
}
