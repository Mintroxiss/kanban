package ru.danilshkuratetskiy.kanban.datasource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.danilshkuratetskiy.kanban.datasource.entity.TeamEntity;

import java.util.UUID;

public interface TeamRepository extends JpaRepository<TeamEntity, UUID> {
}