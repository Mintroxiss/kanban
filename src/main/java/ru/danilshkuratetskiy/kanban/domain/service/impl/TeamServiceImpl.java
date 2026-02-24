package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.EpicEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.TeamEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.UserEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.EpicEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.mapper.TaskEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.mapper.TeamEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.mapper.UserEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.EpicRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.TaskRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.TeamRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.UserRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Epic;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.Team;
import ru.danilshkuratetskiy.kanban.domain.model.User;
import ru.danilshkuratetskiy.kanban.domain.model.UserRole;
import ru.danilshkuratetskiy.kanban.domain.service.TeamService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.BusinessException;
import ru.danilshkuratetskiy.kanban.domain.service.exception.TeamNotFoundException;
import ru.danilshkuratetskiy.kanban.domain.service.exception.UserNotFoundException;
import ru.danilshkuratetskiy.kanban.websocket.BoardEventService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;
    private final TeamEntityMapper teamMapper;

    private final UserRepository userRepository;
    private final UserEntityMapper userMapper;

    private final EpicRepository epicRepository;
    private final EpicEntityMapper epicMapper;

    private final TaskRepository taskRepository;
    private final TaskEntityMapper taskMapper;
    private final BoardEventService boardEventService;

    public TeamServiceImpl(
            TeamRepository teamRepository,
            TeamEntityMapper teamMapper,
            UserRepository userRepository,
            UserEntityMapper userMapper,
            EpicRepository epicRepository,
            EpicEntityMapper epicMapper,
            TaskRepository taskRepository,
            TaskEntityMapper taskMapper,
            BoardEventService boardEventService
    ) {
        this.teamRepository = teamRepository;
        this.teamMapper = teamMapper;
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.epicRepository = epicRepository;
        this.epicMapper = epicMapper;
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
        this.boardEventService = boardEventService;
    }

    @Override
    @Transactional
    public Team create(Team team) {
        TeamEntity entity = teamMapper.toEntity(team);
        TeamEntity saved = teamRepository.save(entity);
        return teamMapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Team update(UUID id, Team team) {
        TeamEntity existing = teamRepository.findById(id)
                .orElseThrow(() -> new TeamNotFoundException("Team not found: " + id));
        existing.setName(team.getName());
        existing.setDirectionId(team.getDirectionId());
        existing.setTeamLeadId(team.getTeamLeadId());
        TeamEntity updated = teamRepository.save(existing);
        return teamMapper.toDomain(updated);
    }

    @Override
    @Transactional
    public Team findById(UUID id) {
        return teamRepository.findById(id)
                .map(teamMapper::toDomain)
                .orElseThrow(() -> new TeamNotFoundException("Team not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Team> findAll() {
        return teamRepository.findAll().stream()
                .map(teamMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Team> findAll(Pageable pageable) {
        return teamRepository.findAll(pageable).map(teamMapper::toDomain);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!teamRepository.existsById(id)) {
            throw new TeamNotFoundException("Team not found: " + id);
        }
        teamRepository.deleteById(id);
    }

    @Override
    @Transactional
    public List<User> getTeamUsers(UUID teamId) {
        List<UserEntity> users = userRepository.findByTeamId(teamId);
        return users.stream()
                .map(userMapper::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public List<Epic> getTeamEpics(UUID teamId) {
        List<EpicEntity> epics = epicRepository.findByTeamId(teamId);
        return epics.stream()
                .map(epicMapper::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public List<Task> getTeamTasks(UUID teamId) {
        return taskRepository.findByTeamId(teamId).stream()
                .map(taskMapper::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public User addUserToTeam(UUID teamId, UUID userId) {
        if (!teamRepository.existsById(teamId)) {
            throw new TeamNotFoundException("Team not found: " + teamId);
        }
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
        user.setTeamId(teamId);
        return userMapper.toDomain(userRepository.save(user));
    }

    @Override
    @Transactional
    public void removeUserFromTeam(UUID teamId, UUID userId) {
        TeamEntity team = teamRepository.findById(teamId)
                .orElseThrow(() -> new TeamNotFoundException("Team not found: " + teamId));
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
        if (!teamId.equals(user.getTeamId())) {
            throw new BusinessException("User is not a member of this team");
        }
        user.setTeamId(null);
        userRepository.save(user);
        if (userId.equals(team.getTeamLeadId())) {
            team.setTeamLeadId(null);
            teamRepository.save(team);
        }
    }

    @Override
    @Transactional
    public Team assignTeamLead(UUID teamId, UUID userId) {
        TeamEntity team = teamRepository.findById(teamId)
                .orElseThrow(() -> new TeamNotFoundException("Team not found: " + teamId));
        UserEntity newLead = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
        if (!teamId.equals(newLead.getTeamId())) {
            throw new BusinessException("User is not a member of this team");
        }

        // Demote previous team lead if different person
        UUID prevLeadId = team.getTeamLeadId();
        if (prevLeadId != null && !prevLeadId.equals(userId)) {
            userRepository.findById(prevLeadId).ifPresent(prevLead -> {
                prevLead.setRole(UserRole.DEVELOPER);
                userRepository.save(prevLead);
                boardEventService.publishUserNotification(prevLeadId, "Ваша роль изменена: Разработчик");
            });
        }

        // Promote new team lead
        newLead.setRole(UserRole.TEAM_LEAD);
        userRepository.save(newLead);
        boardEventService.publishUserNotification(userId, "Ваша роль изменена: Тимлид");

        team.setTeamLeadId(userId);
        return teamMapper.toDomain(teamRepository.save(team));
    }
}
