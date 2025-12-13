package ru.danilshkuratetskiy.kanban.datasource.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.datasource.entity.BoardEntity;
import ru.danilshkuratetskiy.kanban.domain.model.Board;

@Mapper(componentModel = "spring")
public interface BoardEntityMapper {

    BoardEntity toEntity(Board domain);

    Board toDomain(BoardEntity entity);
}
