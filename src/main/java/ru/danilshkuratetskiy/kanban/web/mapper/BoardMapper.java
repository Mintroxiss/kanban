package ru.danilshkuratetskiy.kanban.web.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.domain.model.Board;
import ru.danilshkuratetskiy.kanban.web.dto.BoardDto;

@Mapper(componentModel = "spring")
public interface BoardMapper {
    BoardDto toDto(Board task);
    Board toDomain(BoardDto dto);
}
