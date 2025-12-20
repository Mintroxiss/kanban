package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.EpicEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.EpicEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.EpicRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Epic;
import ru.danilshkuratetskiy.kanban.domain.service.EpicService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.EpicNotFoundException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EpicServiceImpl implements EpicService {

    private final EpicRepository repository;
    private final EpicEntityMapper mapper;

    public EpicServiceImpl(EpicRepository repository, EpicEntityMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public Epic create(Epic epic) {
        EpicEntity entity = mapper.toEntity(epic);
        EpicEntity saved = repository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Epic update(UUID id, Epic epic) {
        EpicEntity existing = repository.findById(id)
                .orElseThrow(() -> new EpicNotFoundException("Epic not found: " + id));
        existing.setTitle(epic.getTitle());
        existing.setDescription(epic.getDescription());
        existing.setBoardId(epic.getBoardId());
        existing.setTeamId(epic.getTeamId());
        EpicEntity updated = repository.save(existing);
        return mapper.toDomain(updated);
    }

    @Override
    @Transactional
    public Epic findById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDomain)
                .orElseThrow(() -> new EpicNotFoundException("Epic not found: " + id));
    }

    @Override
    @Transactional
    public List<Epic> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new EpicNotFoundException("Epic not found: " + id);
        }
        repository.deleteById(id);
    }
}
