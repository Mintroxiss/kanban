package ru.danilshkuratetskiy.kanban.web.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.domain.model.Epic;
import ru.danilshkuratetskiy.kanban.web.dto.entities.EpicDto;

@Mapper(componentModel = "spring")
public interface EpicMapper {
    EpicDto toDto(Epic epic);
    Epic toDomain(EpicDto dto);
}
