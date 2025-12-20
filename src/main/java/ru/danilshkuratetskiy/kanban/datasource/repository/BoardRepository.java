package ru.danilshkuratetskiy.kanban.datasource.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import ru.danilshkuratetskiy.kanban.datasource.entity.BoardEntity;

import java.util.List;
import java.util.UUID;

public interface BoardRepository extends JpaRepository<BoardEntity, UUID> {

    List<BoardEntity> findByDirectionId(UUID directionId);
}
