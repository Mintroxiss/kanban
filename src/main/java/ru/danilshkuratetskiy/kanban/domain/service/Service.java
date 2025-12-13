package ru.danilshkuratetskiy.kanban.domain.service;

import java.util.List;
import java.util.UUID;

public interface Service<T> {

    T create(T board);

    T update(UUID id, T task);

    T findById(UUID id);

    List<T> findAll();

    void delete(UUID id);
}
