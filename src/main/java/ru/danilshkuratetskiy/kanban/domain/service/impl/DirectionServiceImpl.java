package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.DirectionEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.DirectionEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.DirectionRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Direction;
import ru.danilshkuratetskiy.kanban.domain.service.DirectionService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.DirectionNotFoundException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DirectionServiceImpl implements DirectionService {

    private final DirectionRepository repository;
    private final DirectionEntityMapper mapper;

    public DirectionServiceImpl(DirectionRepository repository, DirectionEntityMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public Direction create(Direction direction) {
        DirectionEntity entity = mapper.toEntity(direction);
        DirectionEntity saved = repository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Direction update(UUID id, Direction direction) {
        DirectionEntity existing = repository.findById(id)
                .orElseThrow(() -> new DirectionNotFoundException("Direction not found: " + id));
        existing.setName(direction.getName());
        existing.setDescription(direction.getDescription());
        DirectionEntity updated = repository.save(existing);
        return mapper.toDomain(updated);
    }

    @Override
    @Transactional
    public Direction findById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDomain)
                .orElseThrow(() -> new DirectionNotFoundException("Direction not found: " + id));
    }

    @Override
    @Transactional
    public List<Direction> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new DirectionNotFoundException("Direction not found: " + id);
        }
        repository.deleteById(id);
    }
}
