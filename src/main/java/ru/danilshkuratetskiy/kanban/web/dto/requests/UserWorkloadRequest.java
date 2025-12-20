package ru.danilshkuratetskiy.kanban.web.dto.requests;

public record UserWorkloadRequest(
        int totalTasks,
        int inProgressTasks,
        int doneTasks,
        int overdueTasks
) {

}
