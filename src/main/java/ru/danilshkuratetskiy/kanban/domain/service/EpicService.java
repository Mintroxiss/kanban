package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.Epic;
import ru.danilshkuratetskiy.kanban.domain.model.Task;

import java.util.List;
import java.util.UUID;

public interface EpicService extends Service<Epic> {

    Epic assignTeam(UUID epicId, UUID teamId);

    Epic archiveEpic(UUID epicId);

    Epic restoreEpic(UUID epicId);

    void deleteEpicWithTasks(UUID epicId);

    List<Epic> findActiveByBoard(UUID boardId);

    List<Epic> findArchivedByBoard(UUID boardId);

    List<Task> getEpicTasks(UUID epicId);
}
