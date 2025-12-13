package ru.danilshkuratetskiy.kanban.datasource.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.datasource.entity.UserEntity;
import ru.danilshkuratetskiy.kanban.domain.model.User;

@Mapper(componentModel = "spring")
public interface UserEntityMapper {

    UserEntity toEntity(User domain);

    User toDomain(UserEntity entity);
}
