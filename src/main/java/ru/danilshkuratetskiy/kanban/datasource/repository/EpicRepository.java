package ru.danilshkuratetskiy.kanban.datasource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import ru.danilshkuratetskiy.kanban.datasource.entity.EpicEntity;

import java.util.List;
import java.util.UUID;

public interface EpicRepository extends JpaRepository<EpicEntity, UUID> {

    List<EpicEntity> findByTeamId(UUID teamId);

    List<EpicEntity> findAllByBoardId(UUID boardId);

    @Modifying
    @Query("delete from EpicEntity e where e.boardId = :boardId")
    void deleteAllByBoardId(UUID boardId);
}