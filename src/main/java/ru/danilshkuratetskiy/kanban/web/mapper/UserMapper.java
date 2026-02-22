package ru.danilshkuratetskiy.kanban.web.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ru.danilshkuratetskiy.kanban.domain.model.User;
import ru.danilshkuratetskiy.kanban.web.dto.entities.UserDto;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toDto(User task);

    @Mapping(target = "password", ignore = true)
    User toDomain(UserDto dto);
}
