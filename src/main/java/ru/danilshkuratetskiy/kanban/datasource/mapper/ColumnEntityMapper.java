package ru.danilshkuratetskiy.kanban.datasource.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.datasource.entity.ColumnEntity;
import ru.danilshkuratetskiy.kanban.domain.model.Column;

@Mapper(componentModel = "spring")
public interface ColumnEntityMapper {

    ColumnEntity toEntity(Column domain);

    Column toDomain(ColumnEntity entity);
}
