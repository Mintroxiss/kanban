package ru.danilshkuratetskiy.kanban.web.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.domain.model.User;
import ru.danilshkuratetskiy.kanban.web.dto.UserDto;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toDto(User task);
    User toDomain(UserDto dto);
}
