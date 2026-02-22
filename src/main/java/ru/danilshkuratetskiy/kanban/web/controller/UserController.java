package ru.danilshkuratetskiy.kanban.web.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.User;
import ru.danilshkuratetskiy.kanban.domain.service.UserService;
import ru.danilshkuratetskiy.kanban.web.dto.entities.TaskDto;
import ru.danilshkuratetskiy.kanban.web.dto.entities.UserDto;
import ru.danilshkuratetskiy.kanban.web.dto.requests.UserWorkloadRequest;
import ru.danilshkuratetskiy.kanban.web.mapper.TaskMapper;
import ru.danilshkuratetskiy.kanban.web.mapper.UserMapper;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final TaskMapper taskMapper;

    public UserController(
            UserService userService,
            UserMapper userMapper,
            TaskMapper taskMapper
    ) {
        this.userService = userService;
        this.userMapper = userMapper;
        this.taskMapper = taskMapper;
    }

    @PostMapping
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody UserDto dto) {
        User user = userMapper.toDomain(dto);
        User created = userService.create(user);
        return new ResponseEntity<>(userMapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<UserDto> updateUser(@PathVariable UUID id, @Valid @RequestBody UserDto dto) {
        User user = userMapper.toDomain(dto);
        User updated = userService.update(id, user);
        return ResponseEntity.ok(userMapper.toDto(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable UUID id) {
        User user = userService.findById(id);
        return ResponseEntity.ok(userMapper.toDto(user));
    }

    @GetMapping
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<Page<UserDto>> getAllUsers(
            @PageableDefault(size = 20, sort = "fullName") Pageable pageable) {
        return ResponseEntity.ok(userService.findAll(pageable).map(userMapper::toDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/tasks")
    public List<TaskDto> getUserTasks(@PathVariable UUID userId) {
        return userService.getTasks(userId).stream()
                .map(taskMapper::toDto)
                .toList();
    }

    @GetMapping("/{userId}/workload")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'TEAM_LEAD')")
    public UserWorkloadRequest getWorkload(@PathVariable UUID userId) {
        return userService.getWorkload(userId);
    }
}
