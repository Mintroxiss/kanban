package ru.danilshkuratetskiy.kanban.web.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.domain.model.Team;
import ru.danilshkuratetskiy.kanban.web.dto.entities.TeamDto;

@Mapper(componentModel = "spring")
public interface TeamMapper {
    TeamDto toDto(Team task);
    Team toDomain(TeamDto dto);
}
