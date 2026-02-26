package ru.danilshkuratetskiy.kanban.web.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.domain.model.Board;
import ru.danilshkuratetskiy.kanban.web.dto.entities.BoardDto;

@Mapper(componentModel = "spring")
public interface BoardMapper {
    BoardDto toDto(Board board);
    Board toDomain(BoardDto dto);
}
