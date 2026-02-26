package ru.danilshkuratetskiy.kanban.datasource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.danilshkuratetskiy.kanban.datasource.entity.UserEntity;
import ru.danilshkuratetskiy.kanban.domain.model.UserRole;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    List<UserEntity> findByTeamId(UUID teamId);

    List<UserEntity> findByTeamIdIsNullAndRoleNot(UserRole role);

    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmail(String email);
}