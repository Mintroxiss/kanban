package ru.danilshkuratetskiy.kanban.datasource.mapper;

import org.mapstruct.Mapper;
import ru.danilshkuratetskiy.kanban.datasource.entity.TaskEntity;
import ru.danilshkuratetskiy.kanban.domain.model.Task;

@Mapper(componentModel = "spring")
public interface TaskEntityMapper {

    TaskEntity toEntity(Task domain);

    Task toDomain(TaskEntity entity);
}
