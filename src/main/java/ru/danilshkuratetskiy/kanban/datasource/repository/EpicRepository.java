package ru.danilshkuratetskiy.kanban.datasource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.danilshkuratetskiy.kanban.datasource.entity.EpicEntity;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface EpicRepository extends JpaRepository<EpicEntity, UUID> {

    List<EpicEntity> findByTeamId(UUID teamId);

    List<EpicEntity> findAllByBoardId(UUID boardId);

    List<EpicEntity> findAllByBoardIdAndArchivedFalse(UUID boardId);

    List<EpicEntity> findAllByBoardIdAndArchivedTrue(UUID boardId);

    @Query("select e.id from EpicEntity e where e.id in :ids and e.archived = true")
    Set<UUID> findArchivedIdsByIdIn(@Param("ids") List<UUID> ids);

    @Modifying
    @Query("delete from EpicEntity e where e.boardId = :boardId")
    void deleteAllByBoardId(UUID boardId);
}