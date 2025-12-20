package ru.danilshkuratetskiy.kanban.datasource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.danilshkuratetskiy.kanban.datasource.entity.ColumnEntity;

import java.util.List;
import java.util.UUID;

public interface ColumnRepository extends JpaRepository<ColumnEntity, UUID> {

    List<ColumnEntity> findAllByBoardIdOrderByOrder(UUID boardId);
}
