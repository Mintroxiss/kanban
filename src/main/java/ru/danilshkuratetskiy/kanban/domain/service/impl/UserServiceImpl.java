package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.UserEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.UserEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.UserRepository;
import ru.danilshkuratetskiy.kanban.domain.model.User;
import ru.danilshkuratetskiy.kanban.domain.service.UserService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.UserNotFoundException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository repository;
    private final UserEntityMapper mapper;

    public UserServiceImpl(UserRepository repository, UserEntityMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public User create(User user) {
        UserEntity entity = mapper.toEntity(user);
        UserEntity saved = repository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    @Transactional
    public User update(UUID id, User user) {
        UserEntity existing = repository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
        existing.setFullName(user.getFullName());
        existing.setTeamId(user.getTeamId());
        UserEntity updated = repository.save(existing);
        return mapper.toDomain(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public User findById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDomain)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new UserNotFoundException("User not found: " + id);
        }
        repository.deleteById(id);
    }
}
