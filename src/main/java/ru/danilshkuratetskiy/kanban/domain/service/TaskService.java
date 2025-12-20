package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.TaskStatus;

import java.util.List;
import java.util.UUID;

public interface TaskService extends Service<Task> {

    List<Task> findByStatus(TaskStatus status);

    Task moveTask(UUID taskId, UUID columnId);

    void assignTask(UUID taskId, UUID assigneeId);

    void changeStatus(UUID taskId, TaskStatus newStatus, UUID columnId);
}
