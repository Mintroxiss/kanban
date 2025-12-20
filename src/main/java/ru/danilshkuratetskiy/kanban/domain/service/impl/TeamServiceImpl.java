package ru.danilshkuratetskiy.kanban.domain.service.impl;

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
import ru.danilshkuratetskiy.kanban.domain.service.TeamService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.TeamNotFoundException;

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

    public TeamServiceImpl(
            TeamRepository teamRepository,
            TeamEntityMapper teamMapper,
            UserRepository userRepository,
            UserEntityMapper userMapper,
            EpicRepository epicRepository,
            EpicEntityMapper epicMapper,
            TaskRepository taskRepository,
            TaskEntityMapper taskMapper
    ) {
        this.teamRepository = teamRepository;
        this.teamMapper = teamMapper;
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.epicRepository = epicRepository;
        this.epicMapper = epicMapper;
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
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
    @Transactional
    public List<Team> findAll() {
        return teamRepository.findAll().stream()
                .map(teamMapper::toDomain)
                .collect(Collectors.toList());
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
}
