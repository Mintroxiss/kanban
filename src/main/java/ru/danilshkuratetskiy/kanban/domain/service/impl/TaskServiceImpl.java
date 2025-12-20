package ru.danilshkuratetskiy.kanban.domain.service.impl;

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

    public TaskServiceImpl(
            TaskRepository taskRepository,
            TaskEntityMapper taskMapper,
            UserRepository userRepository,
            EpicRepository epicRepository,
            ColumnRepository columnRepository
    ) {
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
        this.userRepository = userRepository;
        this.epicRepository = epicRepository;
        this.columnRepository = columnRepository;
    }

    @Override
    @Transactional
    public Task create(Task task) {
        TaskEntity entity = taskMapper.toEntity(task);
        TaskEntity saved = taskRepository.save(entity);
        return taskMapper.toDomain(saved);
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
        return taskMapper.toDomain(updated);
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

        return taskMapper.toDomain(
                taskRepository.save(taskMapper.toEntity(task))
        );
    }

    @Override
    @Transactional
    public void assignTask(UUID taskId, UUID assigneeId) {
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

        taskRepository.save(task);
    }

    @Override
    @Transactional
    public void changeStatus(
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

        taskRepository.save(task);
    }

    @Override
    public List<Task> getTasks(UUID userId) {
        List<TaskEntity> tasks = taskRepository.findByAssigneeId(userId);
        return tasks.stream()
                .map(taskMapper::toDomain)
                .toList();
    }
}
