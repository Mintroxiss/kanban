package ru.danilshkuratetskiy.kanban.datasource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.danilshkuratetskiy.kanban.datasource.entity.EpicEntity;

import java.util.UUID;

public interface EpicRepository extends JpaRepository<EpicEntity, UUID> {
}