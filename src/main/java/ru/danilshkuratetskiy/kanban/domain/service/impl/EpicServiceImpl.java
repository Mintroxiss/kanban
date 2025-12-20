package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.EpicEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.TeamEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.EpicEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.EpicRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.TeamRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Epic;
import ru.danilshkuratetskiy.kanban.domain.service.EpicService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.BusinessException;
import ru.danilshkuratetskiy.kanban.domain.service.exception.EpicNotFoundException;
import ru.danilshkuratetskiy.kanban.domain.service.exception.TeamNotFoundException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EpicServiceImpl implements EpicService {

    private final EpicRepository epicRepository;
    private final EpicEntityMapper epicMapper;

    private final TeamRepository teamRepository;

    public EpicServiceImpl(EpicRepository epicRepository, EpicEntityMapper epicMapper, TeamRepository teamRepository) {
        this.epicRepository = epicRepository;
        this.epicMapper = epicMapper;
        this.teamRepository = teamRepository;
    }

    @Override
    @Transactional
    public Epic create(Epic epic) {
        EpicEntity entity = epicMapper.toEntity(epic);
        EpicEntity saved = epicRepository.save(entity);
        return epicMapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Epic update(UUID id, Epic epic) {
        EpicEntity existing = epicRepository.findById(id)
                .orElseThrow(() -> new EpicNotFoundException("Epic not found: " + id));
        existing.setTitle(epic.getTitle());
        existing.setDescription(epic.getDescription());
        existing.setBoardId(epic.getBoardId());
        existing.setTeamId(epic.getTeamId());
        EpicEntity updated = epicRepository.save(existing);
        return epicMapper.toDomain(updated);
    }

    @Override
    @Transactional
    public Epic findById(UUID id) {
        return epicRepository.findById(id)
                .map(epicMapper::toDomain)
                .orElseThrow(() -> new EpicNotFoundException("Epic not found: " + id));
    }

    @Override
    @Transactional
    public List<Epic> findAll() {
        return epicRepository.findAll().stream()
                .map(epicMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!epicRepository.existsById(id)) {
            throw new EpicNotFoundException("Epic not found: " + id);
        }
        epicRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Epic assignTeam(UUID epicId, UUID teamId) {

        EpicEntity epic = epicRepository.findById(epicId)
                .orElseThrow(() -> new EpicNotFoundException("Epic not found"));

        TeamEntity team = teamRepository.findById(teamId)
                .orElseThrow(() -> new TeamNotFoundException("Team not found"));

        if (!epic.getBoardId().equals(team.getDirectionId())) {
            throw new BusinessException("Team direction does not match epic");
        }

        epic.setTeamId(teamId);
        EpicEntity saved = epicRepository.save(epic);

        return epicMapper.toDomain(saved);
    }


}
