package ru.danilshkuratetskiy.kanban.web.mapper;

import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;
import ru.danilshkuratetskiy.kanban.datasource.repository.UserRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.web.dto.entities.TaskDto;

@Mapper(componentModel = "spring")
public abstract class TaskMapper {

    @Autowired
    protected UserRepository userRepository;

    @Mapping(target = "status", expression = "java(task.getStatus().name())")
    @Mapping(target = "assigneeName", ignore = true)
    @Mapping(target = "lastAssigneeName", ignore = true)
    public abstract TaskDto toDto(Task task);

    @AfterMapping
    protected void resolveNames(Task task, @MappingTarget TaskDto dto) {
        if (task.getAssigneeId() != null) {
            userRepository.findById(task.getAssigneeId())
                    .ifPresent(u -> dto.setAssigneeName(u.getFullName()));
        }
        if (task.getLastAssigneeId() != null) {
            userRepository.findById(task.getLastAssigneeId())
                    .ifPresent(u -> dto.setLastAssigneeName(u.getFullName()));
        }
    }

    @Mapping(target = "status", expression = "java(ru.danilshkuratetskiy.kanban.domain.model.TaskStatus.valueOf(dto.getStatus()))")
    public abstract Task toDomain(TaskDto dto);
}
