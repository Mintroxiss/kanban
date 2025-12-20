package ru.danilshkuratetskiy.kanban.domain.service;

import ru.danilshkuratetskiy.kanban.domain.model.Board;
import ru.danilshkuratetskiy.kanban.domain.model.Direction;
import ru.danilshkuratetskiy.kanban.domain.model.Team;

import java.util.List;
import java.util.UUID;

public interface DirectionService extends Service<Direction> {

    List<Board> getBoards(UUID directionId);

    List<Team> getTeams(UUID directionId);
}
