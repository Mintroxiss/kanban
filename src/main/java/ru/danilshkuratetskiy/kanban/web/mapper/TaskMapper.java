package ru.danilshkuratetskiy.kanban.web.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.web.dto.TaskDto;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    @Mapping(target = "status", expression = "java(task.getStatus().name())")
    TaskDto toDto(Task task);

    @Mapping(target = "status", expression = "java(ru.danilshkuratetskiy.kanban.domain.model.TaskStatus.valueOf(dto.getStatus()))")
    Task toDomain(TaskDto dto);
}
