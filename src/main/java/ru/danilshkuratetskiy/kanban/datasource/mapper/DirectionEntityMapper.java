package ru.danilshkuratetskiy.kanban.datasource.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.datasource.entity.DirectionEntity;
import ru.danilshkuratetskiy.kanban.domain.model.Direction;

@Mapper(componentModel = "spring")
public interface DirectionEntityMapper {

    DirectionEntity toEntity(Direction domain);

    Direction toDomain(DirectionEntity entity);
}
