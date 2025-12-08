package ru.danilshkuratetskiy.kanban.web.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.TaskStatus;
import ru.danilshkuratetskiy.kanban.domain.service.TaskService;
import ru.danilshkuratetskiy.kanban.web.dto.TaskDto;
import ru.danilshkuratetskiy.kanban.web.mapper.TaskMapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;
    private final TaskMapper taskMapper;

    public TaskController(TaskService taskService, TaskMapper taskMapper) {
        this.taskService = taskService;
        this.taskMapper = taskMapper;
    }

    @PostMapping
    public ResponseEntity<TaskDto> createTask(@RequestBody TaskDto dto) {
        Task task = taskMapper.toDomain(dto);
        Task created = taskService.create(task);
        return new ResponseEntity<>(taskMapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDto> updateTask(@PathVariable UUID id, @RequestBody TaskDto dto) {
        Task task = taskMapper.toDomain(dto);
        Task updated = taskService.update(id, task);
        return ResponseEntity.ok(taskMapper.toDto(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDto> getTaskById(@PathVariable UUID id) {
        Task task = taskService.findById(id);
        return ResponseEntity.ok(taskMapper.toDto(task));
    }

    @GetMapping
    public ResponseEntity<List<TaskDto>> getAllTasks() {
        List<TaskDto> tasks = taskService.findAll().stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TaskDto>> getTasksByStatus(@PathVariable String status) {
        TaskStatus taskStatus = TaskStatus.valueOf(status.toUpperCase());
        List<TaskDto> tasks = taskService.findByStatus(taskStatus).stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }
}
