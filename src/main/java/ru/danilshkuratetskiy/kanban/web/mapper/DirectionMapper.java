package ru.danilshkuratetskiy.kanban.web.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.domain.model.Direction;
import ru.danilshkuratetskiy.kanban.web.dto.DirectionDto;

@Mapper(componentModel = "spring")
public interface DirectionMapper {
    DirectionDto toDto(Direction task);
    Direction toDomain(DirectionDto dto);
}
