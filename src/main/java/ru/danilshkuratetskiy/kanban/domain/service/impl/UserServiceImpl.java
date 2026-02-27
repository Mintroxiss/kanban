package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.TaskEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.UserEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.TaskEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.mapper.UserEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.entity.TeamEntity;
import ru.danilshkuratetskiy.kanban.datasource.repository.TaskRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.TeamRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.UserRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.TaskStatus;
import ru.danilshkuratetskiy.kanban.domain.model.User;
import ru.danilshkuratetskiy.kanban.domain.model.UserRole;
import ru.danilshkuratetskiy.kanban.domain.service.UserService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.UserNotFoundException;
import ru.danilshkuratetskiy.kanban.web.dto.requests.UserWorkloadRequest;
import ru.danilshkuratetskiy.kanban.websocket.BoardEventService;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserEntityMapper userMapper;

    private final TaskRepository taskRepository;
    private final TaskEntityMapper taskMapper;

    private final TeamRepository teamRepository;

    private final BoardEventService boardEventService;

    public UserServiceImpl(
            UserRepository userRepository,
            UserEntityMapper userMapper,
            TaskRepository taskRepository,
            TaskEntityMapper taskMapper,
            TeamRepository teamRepository,
            BoardEventService boardEventService
    ) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
        this.teamRepository = teamRepository;
        this.boardEventService = boardEventService;
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
    @Transactional(readOnly = true)
    public Page<User> findAll(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toDomain);
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
    public UserWorkloadRequest getWorkload(UUID userId) {

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

        return new UserWorkloadRequest(total, inProgress, done, overdue);
    }

    @Override
    public List<Task> getTasks(UUID userId) {
        List<TaskEntity> tasks = taskRepository.findByAssigneeId(userId);
        return tasks.stream()
                .map(taskMapper::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public User changeRole(UUID id, UserRole role) {
        UserEntity entity = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
        entity.setRole(role);
        User updated = userMapper.toDomain(userRepository.save(entity));
        String roleLabel = role == UserRole.TEAM_LEAD ? "Тимлид" : "Разработчик";
        // Отправляем обновлённые role + teamId — фронтенд обновит authStore без перелогина
        boardEventService.publishUserProfileUpdate(id, "Ваша роль изменена: " + roleLabel,
                role.name(), entity.getTeamId());

        if (entity.getTeamId() != null) {
            teamRepository.findById(entity.getTeamId()).ifPresent((TeamEntity team) -> {
                if (role == UserRole.TEAM_LEAD) {
                    // Разжаловать предыдущего тимлида, если это другой человек
                    UUID prevLeadId = team.getTeamLeadId();
                    if (prevLeadId != null && !prevLeadId.equals(id)) {
                        userRepository.findById(prevLeadId).ifPresent(prevLead -> {
                            prevLead.setRole(UserRole.DEVELOPER);
                            userRepository.save(prevLead);
                            boardEventService.publishUserProfileUpdate(prevLeadId,
                                    "Ваша роль изменена: Разработчик",
                                    UserRole.DEVELOPER.name(), entity.getTeamId());
                        });
                    }
                    team.setTeamLeadId(id);
                    teamRepository.save(team);
                } else if (role == UserRole.DEVELOPER && id.equals(team.getTeamLeadId())) {
                    // Снять с должности тимлида при понижении до разработчика
                    team.setTeamLeadId(null);
                    teamRepository.save(team);
                }
            });
        }

        return updated;
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findByTeamId(UUID teamId) {
        return userRepository.findByTeamId(teamId).stream()
                .filter(u -> u.getRole() != UserRole.ADMIN)
                .map(userMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findAvailableForTeam() {
        return userRepository.findByTeamIdIsNullAndRoleNot(UserRole.ADMIN).stream()
                .map(userMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, String> findFullNamesByIds(Set<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(UserEntity::getId, UserEntity::getFullName));
    }

    @Override
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(userMapper::toDomain)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + email));
    }
}
