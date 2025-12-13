package ru.danilshkuratetskiy.kanban.datasource.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.datasource.entity.EpicEntity;
import ru.danilshkuratetskiy.kanban.domain.model.Epic;

@Mapper(componentModel = "spring")
public interface EpicEntityMapper {

    EpicEntity toEntity(Epic domain);

    Epic toDomain(EpicEntity entity);
}