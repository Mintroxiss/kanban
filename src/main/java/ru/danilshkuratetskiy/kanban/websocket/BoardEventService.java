package ru.danilshkuratetskiy.kanban.websocket;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.web.mapper.TaskMapper;

import java.util.UUID;

@Service
public class BoardEventService {

    private final SimpMessagingTemplate messaging;
    private final TaskMapper taskMapper;

    public BoardEventService(SimpMessagingTemplate messaging, TaskMapper taskMapper) {
        this.messaging = messaging;
        this.taskMapper = taskMapper;
    }

    public void publishTaskEvent(UUID boardId, String type, Task task) {
        BoardEvent event = new BoardEvent(type, taskMapper.toDto(task));
        messaging.convertAndSend("/topic/board/" + boardId, event);
    }

    public void publishUserNotification(UUID userId, String message) {
        messaging.convertAndSend("/topic/user/" + userId, new UserNotification(message));
    }

    public record UserNotification(String message) {}
}
