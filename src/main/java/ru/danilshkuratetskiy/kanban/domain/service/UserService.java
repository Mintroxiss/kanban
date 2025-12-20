package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.User;
import ru.danilshkuratetskiy.kanban.web.dto.requests.UserWorkloadResponse;

import java.util.UUID;

public interface UserService extends Service<User> {

    UserWorkloadResponse getWorkload(UUID userId);
}
