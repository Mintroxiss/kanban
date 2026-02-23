package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.ColumnEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.EpicEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.TaskEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.UserEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.TaskEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.ColumnRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.EpicRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.TaskRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.UserRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.TaskStatus;
import ru.danilshkuratetskiy.kanban.domain.service.TaskService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.*;
import ru.danilshkuratetskiy.kanban.websocket.BoardEventService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final TaskEntityMapper taskMapper;

    private final UserRepository userRepository;
    private final EpicRepository epicRepository;
    private final ColumnRepository columnRepository;
    private final BoardEventService boardEventService;

    public TaskServiceImpl(
            TaskRepository taskRepository,
            TaskEntityMapper taskMapper,
            UserRepository userRepository,
            EpicRepository epicRepository,
            ColumnRepository columnRepository,
            BoardEventService boardEventService
    ) {
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
        this.userRepository = userRepository;
        this.epicRepository = epicRepository;
        this.columnRepository = columnRepository;
        this.boardEventService = boardEventService;
    }

    @Override
    @Transactional
    public Task create(Task task) {
        TaskEntity entity = taskMapper.toEntity(task);
        TaskEntity saved = taskRepository.save(entity);
        Task result = taskMapper.toDomain(saved);

        EpicEntity epic = epicRepository.findById(saved.getEpicId())
                .orElseThrow(() -> new EpicNotFoundException("Epic not found"));
        boardEventService.publishTaskEvent(epic.getBoardId(), "TASK_CREATED", result);

        return result;
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
        existing.setColumnId(task.getColumnId());
        existing.setEpicId(task.getEpicId());
        TaskEntity updated = taskRepository.save(existing);
        Task result = taskMapper.toDomain(updated);

        EpicEntity epic = epicRepository.findById(updated.getEpicId())
                .orElseThrow(() -> new EpicNotFoundException("Epic not found"));
        boardEventService.publishTaskEvent(epic.getBoardId(), "TASK_UPDATED", result);

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Task findById(UUID id) {
        return taskRepository.findById(id)
                .map(taskMapper::toDomain)
                .orElseThrow(() -> new TaskNotFoundException("Task not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Task> findAll() {
        return taskRepository.findAll().stream()
                .map(taskMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Task> findAll(Pageable pageable) {
        return taskRepository.findAll(pageable).map(taskMapper::toDomain);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        TaskEntity entity = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException("Task not found: " + id));
        Task task = taskMapper.toDomain(entity);

        EpicEntity epic = epicRepository.findById(entity.getEpicId())
                .orElseThrow(() -> new EpicNotFoundException("Epic not found"));
        UUID boardId = epic.getBoardId();

        taskRepository.deleteById(id);
        boardEventService.publishTaskEvent(boardId, "TASK_DELETED", task);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Task> findByStatus(TaskStatus status) {
        return taskRepository.findAll().stream()
                .map(taskMapper::toDomain)
                .filter(t -> t.getStatus() == status)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Task moveTask(UUID taskId, UUID columnId) {
        TaskEntity entity = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException("Task not found"));

        Task task = taskMapper.toDomain(entity);
        task.setColumnId(columnId);

        Task result = taskMapper.toDomain(
                taskRepository.save(taskMapper.toEntity(task))
        );

        ColumnEntity column = columnRepository.findById(columnId)
                .orElseThrow(() -> new ColumnNotFoundException("Column not found"));
        boardEventService.publishTaskEvent(column.getBoardId(), "TASK_MOVED", result);

        return result;
    }

    @Override
    @Transactional
    public Task assignTask(UUID taskId, UUID assigneeId) {
        TaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException("Task not found"));

        UserEntity user = userRepository.findById(assigneeId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        EpicEntity epic = epicRepository.findById(task.getEpicId())
                .orElseThrow(() -> new EpicNotFoundException("Epic not found"));

        if (epic.getTeamId() != null &&
                !epic.getTeamId().equals(user.getTeamId())) {

            throw new BusinessException(
                    "User does not belong to the epic team"
            );
        }

        task.setAssigneeId(assigneeId);

        TaskEntity saved = taskRepository.save(task);
        Task result = taskMapper.toDomain(saved);
        boardEventService.publishTaskEvent(epic.getBoardId(), "TASK_UPDATED", result);

        return result;
    }

    @Override
    @Transactional
    public Task changeStatus(
            UUID taskId,
            TaskStatus newStatus,
            UUID columnId
    ) {
        TaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException("Task not found"));

        ColumnEntity column = columnRepository.findById(columnId)
                .orElseThrow(() -> new ColumnNotFoundException("Column not found"));

        EpicEntity epic = epicRepository.findById(task.getEpicId())
                .orElseThrow(() -> new EpicNotFoundException("Epic not found"));

        if (!column.getBoardId().equals(epic.getBoardId())) {
            throw new BusinessException(
                    "Column does not belong to epic board"
            );
        }

        task.setStatus(newStatus);
        task.setColumnId(columnId);

        TaskEntity saved = taskRepository.save(task);
        Task result = taskMapper.toDomain(saved);
        boardEventService.publishTaskEvent(column.getBoardId(), "TASK_MOVED", result);

        return result;
    }
}
