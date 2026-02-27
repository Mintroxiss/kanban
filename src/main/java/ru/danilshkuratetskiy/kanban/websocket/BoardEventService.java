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

    public void publishToBoard(UUID boardId, String type, Object payload) {
        messaging.convertAndSend("/topic/board/" + boardId, new BoardEvent(type, payload));
    }

    public void publishToBoards(String type, Object payload) {
        messaging.convertAndSend("/topic/boards", new BoardEvent(type, payload));
    }

    /** Простое текстовое уведомление без изменения профиля */
    public void publishUserNotification(UUID userId, String message) {
        messaging.convertAndSend("/topic/user/" + userId,
                new UserNotification("MESSAGE", message, null, null));
    }

    /** Уведомление об изменении роли/команды — фронтенд обновит authStore без перелогина */
    public void publishUserProfileUpdate(UUID userId, String message, String role, UUID teamId) {
        messaging.convertAndSend("/topic/user/" + userId,
                new UserNotification("PROFILE_UPDATE", message, role,
                        teamId != null ? teamId.toString() : null));
    }

    public record UserNotification(String type, String message, String role, String teamId) {}
}
