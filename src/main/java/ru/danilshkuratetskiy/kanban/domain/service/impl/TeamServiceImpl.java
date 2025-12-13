package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.TeamEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.TeamEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.TeamRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Team;
import ru.danilshkuratetskiy.kanban.domain.service.TeamService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.TeamNotFoundException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TeamServiceImpl implements TeamService {

    private final TeamRepository repository;
    private final TeamEntityMapper mapper;

    public TeamServiceImpl(TeamRepository repository, TeamEntityMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public Team create(Team team) {
        TeamEntity entity = mapper.toEntity(team);
        TeamEntity saved = repository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Team update(UUID id, Team team) {
        TeamEntity existing = repository.findById(id)
                .orElseThrow(() -> new TeamNotFoundException("Team not found: " + id));
        existing.setName(team.getName());
        existing.setDirectionId(team.getDirectionId());
        existing.setTeamLeadId(team.getTeamLeadId());
        TeamEntity updated = repository.save(existing);
        return mapper.toDomain(updated);
    }

    @Override
    @Transactional
    public Team findById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDomain)
                .orElseThrow(() -> new TeamNotFoundException("Team not found: " + id));
    }

    @Override
    @Transactional
    public List<Team> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new TeamNotFoundException("Team not found: " + id);
        }
        repository.deleteById(id);
    }
}
