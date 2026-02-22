package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.Epic;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.model.Team;
import ru.danilshkuratetskiy.kanban.domain.model.User;

import java.util.List;
import java.util.UUID;

public interface TeamService extends Service<Team> {

    List<User> getTeamUsers(UUID teamId);

    List<Epic> getTeamEpics(UUID teamId);

    List<Task> getTeamTasks(UUID teamId);

    User addUserToTeam(UUID teamId, UUID userId);

    void removeUserFromTeam(UUID teamId, UUID userId);

    Team assignTeamLead(UUID teamId, UUID userId);
}
