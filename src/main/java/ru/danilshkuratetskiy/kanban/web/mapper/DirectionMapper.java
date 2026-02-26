package ru.danilshkuratetskiy.kanban.web.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.domain.model.Direction;
import ru.danilshkuratetskiy.kanban.web.dto.entities.DirectionDto;

@Mapper(componentModel = "spring")
public interface DirectionMapper {
    DirectionDto toDto(Direction direction);
    Direction toDomain(DirectionDto dto);
}
