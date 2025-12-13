package ru.danilshkuratetskiy.kanban.datasource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.danilshkuratetskiy.kanban.datasource.entity.DirectionEntity;

import java.util.UUID;

public interface DirectionRepository extends JpaRepository<DirectionEntity, UUID> {
}
