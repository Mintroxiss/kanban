package ru.danilshkuratetskiy.kanban.datasource.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.datasource.entity.TeamEntity;
import ru.danilshkuratetskiy.kanban.domain.model.Team;

@Mapper(componentModel = "spring")
public interface TeamEntityMapper {

    TeamEntity toEntity(Team domain);

    Team toDomain(TeamEntity entity);
}
