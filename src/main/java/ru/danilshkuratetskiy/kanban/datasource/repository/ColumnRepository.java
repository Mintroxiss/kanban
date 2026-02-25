package ru.danilshkuratetskiy.kanban.datasource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import ru.danilshkuratetskiy.kanban.datasource.entity.ColumnEntity;

import java.util.List;
import java.util.UUID;

public interface ColumnRepository extends JpaRepository<ColumnEntity, UUID> {

    List<ColumnEntity> findAllByBoardIdOrderByOrder(UUID boardId);

    @Modifying
    @Query("delete from ColumnEntity c where c.boardId = :boardId")
    void deleteAllByBoardId(UUID boardId);
}
