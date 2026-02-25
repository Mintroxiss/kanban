package ru.danilshkuratetskiy.kanban.datasource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import ru.danilshkuratetskiy.kanban.datasource.entity.TaskEntity;

import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {

    boolean existsByColumnId(UUID columnId);

    List<TaskEntity> findAllByColumnIdIn(List<UUID> columnIds);

    List<TaskEntity> findAllByColumnIdInAndEpicId(List<UUID> columnIds, UUID epicId);

    List<TaskEntity> findByAssigneeId(UUID assigneeId);

    @Query("""
                select t from TaskEntity t
                join EpicEntity e on t.epicId = e.id
                where e.teamId = :teamId
            """)
    List<TaskEntity> findByTeamId(UUID teamId);

    @Modifying
    @Query("delete from TaskEntity t where t.epicId in :epicIds")
    void deleteAllByEpicIdIn(List<UUID> epicIds);
}
