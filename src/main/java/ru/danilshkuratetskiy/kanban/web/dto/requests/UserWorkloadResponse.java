package ru.danilshkuratetskiy.kanban.web.dto.requests;

public record UserWorkloadResponse(
        int totalTasks,
        int inProgressTasks,
        int doneTasks,
        int overdueTasks
) {

}
