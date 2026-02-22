package ru.danilshkuratetskiy.kanban.domain.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface Service<T> {

    T create(T board);

    T update(UUID id, T task);

    T findById(UUID id);

    List<T> findAll();

    Page<T> findAll(Pageable pageable);

    void delete(UUID id);
}
