package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.TaskStatus;

import java.util.List;
import java.util.UUID;

public interface TaskService extends Service<Task> {

    List<Task> findByStatus(TaskStatus status);

    Task moveTask(UUID taskId, UUID columnId);

    Task assignTask(UUID taskId, UUID assigneeId);

    Task releaseTask(UUID taskId);

    Task changeStatus(UUID taskId, TaskStatus newStatus, UUID columnId);
}
