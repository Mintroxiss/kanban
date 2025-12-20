package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.TaskEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.UserEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.UserEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.TaskRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.UserRepository;
import ru.danilshkuratetskiy.kanban.domain.model.TaskStatus;
import ru.danilshkuratetskiy.kanban.domain.model.User;
import ru.danilshkuratetskiy.kanban.domain.service.UserService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.UserNotFoundException;
import ru.danilshkuratetskiy.kanban.web.dto.requests.UserWorkloadResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserEntityMapper userMapper;

    private final TaskRepository taskRepository;

    public UserServiceImpl(UserRepository userRepository, UserEntityMapper userMapper, TaskRepository taskRepository) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.taskRepository = taskRepository;
    }

    @Override
    @Transactional
    public User create(User user) {
        UserEntity entity = userMapper.toEntity(user);
        UserEntity saved = userRepository.save(entity);
        return userMapper.toDomain(saved);
    }

    @Override
    @Transactional
    public User update(UUID id, User user) {
        UserEntity existing = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
        existing.setFullName(user.getFullName());
        existing.setTeamId(user.getTeamId());
        UserEntity updated = userRepository.save(existing);
        return userMapper.toDomain(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public User findById(UUID id) {
        return userRepository.findById(id)
                .map(userMapper::toDomain)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userRepository.findAll().stream()
                .map(userMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }

    @Override
    @Transactional
    public UserWorkloadResponse getWorkload(UUID userId) {

        List<TaskEntity> tasks = taskRepository.findByAssigneeId(userId);

        int total = tasks.size();
        int inProgress = (int) tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS)
                .count();
        int done = (int) tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE)
                .count();
        int overdue = (int) tasks.stream()
                .filter(t -> t.getDeadline().isBefore(LocalDate.now()))
                .count();

        return new UserWorkloadResponse(total, inProgress, done, overdue);
    }
}
