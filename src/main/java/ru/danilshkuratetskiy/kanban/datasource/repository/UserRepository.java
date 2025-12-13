package ru.danilshkuratetskiy.kanban.datasource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.danilshkuratetskiy.kanban.datasource.entity.UserEntity;

import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {
}