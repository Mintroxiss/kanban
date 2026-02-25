package ru.danilshkuratetskiy.kanban.datasource.repository;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.danilshkuratetskiy.kanban.datasource.entity.BoardEntity;

import java.util.List;
import java.util.UUID;

public interface BoardRepository extends JpaRepository<BoardEntity, UUID> {

    List<BoardEntity> findByDirectionId(UUID directionId);

    List<BoardEntity> findAllByArchivedFalse();

    Page<BoardEntity> findAllByArchivedFalse(Pageable pageable);

    Page<BoardEntity> findAllByArchivedTrue(Pageable pageable);
}
