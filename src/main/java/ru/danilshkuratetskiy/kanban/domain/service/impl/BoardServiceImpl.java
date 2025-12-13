package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.BoardEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.BoardEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.BoardRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Board;
import ru.danilshkuratetskiy.kanban.domain.service.BoardService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.BoardNotFoundException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BoardServiceImpl implements BoardService {

    private final BoardRepository repository;
    private final BoardEntityMapper mapper;

    public BoardServiceImpl(BoardRepository repository, BoardEntityMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public Board create(Board board) {
        BoardEntity entity = mapper.toEntity(board);
        BoardEntity saved = repository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Board update(UUID id, Board board) {
        BoardEntity existing = repository.findById(id)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + id));
        existing.setName(board.getName());
        existing.setDirectionId(board.getDirectionId());
        BoardEntity updated = repository.save(existing);
        return mapper.toDomain(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Board findById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDomain)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Board> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new BoardNotFoundException("Board not found: " + id);
        }
        repository.deleteById(id);
    }
}
