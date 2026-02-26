package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.User;
import ru.danilshkuratetskiy.kanban.domain.model.UserRole;
import ru.danilshkuratetskiy.kanban.web.dto.requests.UserWorkloadRequest;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public interface UserService extends Service<User> {

    List<Task> getTasks(UUID userId);

    UserWorkloadRequest getWorkload(UUID userId);

    User changeRole(UUID id, UserRole role);

    User findByEmail(String email);

    List<User> findByTeamId(UUID teamId);

    List<User> findAvailableForTeam();

    Map<UUID, String> findFullNamesByIds(Set<UUID> ids);
}
