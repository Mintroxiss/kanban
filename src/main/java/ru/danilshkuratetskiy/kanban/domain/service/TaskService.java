package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.TaskStatus;

import java.util.List;

public interface TaskService extends Service<Task> {
    List<Task> findByStatus(TaskStatus status);
}
