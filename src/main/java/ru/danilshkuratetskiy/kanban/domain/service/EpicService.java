package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.Epic;

import java.util.UUID;

public interface EpicService extends Service<Epic> {

    Epic assignTeam(UUID epicId, UUID teamId);
}
