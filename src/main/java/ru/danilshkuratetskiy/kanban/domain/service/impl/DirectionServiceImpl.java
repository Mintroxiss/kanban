package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.DirectionEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.BoardEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.mapper.DirectionEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.mapper.TeamEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.BoardRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.DirectionRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.TeamRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Board;
import ru.danilshkuratetskiy.kanban.domain.model.Direction;
import ru.danilshkuratetskiy.kanban.domain.model.Team;
import ru.danilshkuratetskiy.kanban.domain.service.DirectionService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.DirectionNotFoundException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DirectionServiceImpl implements DirectionService {

    private final DirectionRepository directionRepository;
    private final DirectionEntityMapper directionMapper;

    private final BoardRepository boardRepository;
    private final BoardEntityMapper boardMapper;

    private final TeamRepository teamRepository;
    private final TeamEntityMapper teamMapper;

    public DirectionServiceImpl(
            DirectionRepository directionRepository,
            DirectionEntityMapper directionMapper,
            BoardRepository boardRepository,
            BoardEntityMapper boardMapper,
            TeamRepository teamRepository,
            TeamEntityMapper teamMapper
    ) {
        this.directionRepository = directionRepository;
        this.directionMapper = directionMapper;
        this.boardRepository = boardRepository;
        this.boardMapper = boardMapper;
        this.teamRepository = teamRepository;
        this.teamMapper = teamMapper;
    }

    @Override
    @Transactional
    public Direction create(Direction direction) {
        DirectionEntity entity = directionMapper.toEntity(direction);
        DirectionEntity saved = directionRepository.save(entity);
        return directionMapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Direction update(UUID id, Direction direction) {
        DirectionEntity existing = directionRepository.findById(id)
                .orElseThrow(() -> new DirectionNotFoundException("Direction not found: " + id));
        existing.setName(direction.getName());
        existing.setDescription(direction.getDescription());
        DirectionEntity updated = directionRepository.save(existing);
        return directionMapper.toDomain(updated);
    }

    @Override
    @Transactional
    public Direction findById(UUID id) {
        return directionRepository.findById(id)
                .map(directionMapper::toDomain)
                .orElseThrow(() -> new DirectionNotFoundException("Direction not found: " + id));
    }

    @Override
    @Transactional
    public List<Direction> findAll() {
        return directionRepository.findAll().stream()
                .map(directionMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!directionRepository.existsById(id)) {
            throw new DirectionNotFoundException("Direction not found: " + id);
        }
        directionRepository.deleteById(id);
    }

    @Override
    @Transactional
    public List<Board> getBoards(UUID directionId) {
        return boardRepository.findByDirectionId(directionId).stream()
                .map(boardMapper::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public List<Team> getTeams(UUID directionId) {
        return teamRepository.findByDirectionId(directionId).stream()
                .map(teamMapper::toDomain)
                .toList();
    }
}
