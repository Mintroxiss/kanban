package ru.danilshkuratetskiy.kanban.web.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.TaskStatus;
import ru.danilshkuratetskiy.kanban.domain.model.User;
import ru.danilshkuratetskiy.kanban.domain.service.TaskService;
import ru.danilshkuratetskiy.kanban.domain.service.UserService;
import ru.danilshkuratetskiy.kanban.web.dto.requests.AssignTaskRequest;
import ru.danilshkuratetskiy.kanban.web.dto.requests.ChangeTaskStatusRequest;
import ru.danilshkuratetskiy.kanban.web.dto.entities.TaskDto;
import ru.danilshkuratetskiy.kanban.web.dto.requests.MoveTaskRequest;
import ru.danilshkuratetskiy.kanban.web.mapper.TaskMapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService service;
    private final TaskMapper mapper;
    private final UserService userService;

    public TaskController(TaskService service, TaskMapper mapper, UserService userService) {
        this.service = service;
        this.mapper = mapper;
        this.userService = userService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody TaskDto dto) {
        Task task = mapper.toDomain(dto);
        Task created = service.create(task);
        return new ResponseEntity<>(mapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('TEAM_LEAD') and @accessControl.isEpicAssignedToMyTeam(#id))")
    public ResponseEntity<TaskDto> updateTask(@PathVariable UUID id, @Valid @RequestBody TaskDto dto) {
        Task task = mapper.toDomain(dto);
        Task updated = service.update(id, task);
        return ResponseEntity.ok(mapper.toDto(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDto> getTaskById(@PathVariable UUID id) {
        Task task = service.findById(id);
        return ResponseEntity.ok(mapper.toDto(task));
    }

    @GetMapping
    public ResponseEntity<Page<TaskDto>> getAllTasks(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable).map(mapper::toDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('TEAM_LEAD') and @accessControl.isEpicAssignedToMyTeam(#id))")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TaskDto>> getTasksByStatus(@PathVariable String status) {
        TaskStatus taskStatus = TaskStatus.valueOf(status.toUpperCase());
        List<TaskDto> tasks = service.findByStatus(taskStatus).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @PatchMapping("/{id}/move")
    @PreAuthorize("hasRole('ADMIN') or " +
            "((hasRole('TEAM_LEAD') or @accessControl.isTaskAssignedToMe(#id)) and @accessControl.isEpicAssignedToMyTeam(#id))")
    public ResponseEntity<TaskDto> moveTask(
            @PathVariable UUID id,
            @Valid @RequestBody MoveTaskRequest request
    ) {
        TaskDto task = mapper.toDto(service.moveTask(id, request.columnId()));
        return ResponseEntity.ok(task);
    }

    @PatchMapping("/{taskId}/take")
    @PreAuthorize("hasRole('ADMIN') or @accessControl.isEpicAssignedToMyTeam(#taskId)")
    public ResponseEntity<TaskDto> takeTask(
            @PathVariable UUID taskId,
            Authentication authentication
    ) {
        User currentUser = userService.findByEmail(authentication.getName());
        Task task = service.assignTask(taskId, currentUser.getId());
        return ResponseEntity.ok(mapper.toDto(task));
    }

    @PatchMapping("/{taskId}/release")
    @PreAuthorize("hasRole('ADMIN') or @accessControl.isTaskAssignedToMe(#taskId) or (hasRole('TEAM_LEAD') and @accessControl.isEpicAssignedToMyTeam(#taskId))")
    public ResponseEntity<TaskDto> releaseTask(@PathVariable UUID taskId) {
        Task task = service.releaseTask(taskId);
        return ResponseEntity.ok(mapper.toDto(task));
    }

    @PatchMapping("/{taskId}/assign")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('TEAM_LEAD') and @accessControl.isEpicAssignedToMyTeam(#taskId))")
    public ResponseEntity<TaskDto> assignTask(
            @PathVariable UUID taskId,
            @Valid @RequestBody AssignTaskRequest request
    ) {
        Task task = service.assignTask(taskId, request.assigneeId());
        return ResponseEntity.ok(mapper.toDto(task));
    }

    @PatchMapping("/{taskId}/status")
    @PreAuthorize("hasRole('ADMIN') or " +
            "((hasRole('TEAM_LEAD') or @accessControl.isTaskAssignedToMe(#taskId)) and @accessControl.isEpicAssignedToMyTeam(#taskId))")
    public ResponseEntity<TaskDto> changeStatus(
            @PathVariable UUID taskId,
            @Valid @RequestBody ChangeTaskStatusRequest request
    ) {
        Task task = service.changeStatus(
                taskId,
                request.status(),
                request.columnId()
        );
        return ResponseEntity.ok(mapper.toDto(task));
    }
}
