package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.User;
import ru.danilshkuratetskiy.kanban.web.dto.requests.UserWorkloadRequest;

import java.util.List;
import java.util.UUID;

public interface UserService extends Service<User> {

    List<Task> getTasks(UUID userId);

    UserWorkloadRequest getWorkload(UUID userId);
}
