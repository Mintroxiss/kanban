package ru.danilshkuratetskiy.kanban.datasource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.danilshkuratetskiy.kanban.datasource.entity.TaskEntity;

import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {

    List<TaskEntity> findAllByColumnIdInAndEpicId(List<UUID> columnIds, UUID epicId);

    List<TaskEntity> findAllByEpicId(UUID epicId);

    List<TaskEntity> findAllByColumnId(UUID columnId);

    // Только задачи активных (не заархивированных) эпиков — для основного представления доски
    @Query("""
                select t from TaskEntity t
                join EpicEntity e on t.epicId = e.id
                where t.columnId in :columnIds and e.archived = false
            """)
    List<TaskEntity> findAllByColumnIdInAndEpicArchivedFalse(@Param("columnIds") List<UUID> columnIds);

    boolean existsByEpicIdAndTitle(UUID epicId, String title);

    boolean existsByEpicIdAndTitleAndIdNot(UUID epicId, String title, UUID id);

    List<TaskEntity> findByAssigneeId(UUID assigneeId);

    @Query("""
                select t from TaskEntity t
                join EpicEntity e on t.epicId = e.id
                where e.teamId = :teamId
            """)
    List<TaskEntity> findByTeamId(UUID teamId);

    // JPQL bulk-delete задач при каскадном удалении эпиков или доски
    @Modifying
    @Query("delete from TaskEntity t where t.epicId in :epicIds")
    void deleteAllByEpicIdIn(List<UUID> epicIds);
}
