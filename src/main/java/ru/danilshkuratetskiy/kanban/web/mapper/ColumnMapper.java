package ru.danilshkuratetskiy.kanban.web.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.domain.model.Column;
import ru.danilshkuratetskiy.kanban.web.dto.entities.ColumnDto;

@Mapper(componentModel = "spring")
public interface ColumnMapper {
    ColumnDto toDto(Column column);
    Column toDomain(ColumnDto dto);
}
