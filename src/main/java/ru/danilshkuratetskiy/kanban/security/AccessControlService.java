package ru.danilshkuratetskiy.kanban.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import ru.danilshkuratetskiy.kanban.datasource.repository.BoardRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.EpicRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.TaskRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.TeamRepository;

import java.util.UUID;

@Service("accessControl")
@RequiredArgsConstructor
public class AccessControlService {

    private final TeamRepository teamRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final EpicRepository epicRepository;

    private UserPrincipal principal() {
        return (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    /** Текущий пользователь принадлежит к данной команде */
    public boolean isInTeam(UUID teamId) {
        return teamId.equals(principal().getTeamId());
    }

    /** Команда текущего пользователя принадлежит к данному направлению */
    public boolean isInDirection(UUID directionId) {
        UUID teamId = principal().getTeamId();
        if (teamId == null) return false;
        return teamRepository.findById(teamId)
                .map(t -> t.getDirectionId().equals(directionId))
                .orElse(false);
    }

    /** Доска принадлежит к тому же направлению, что и команда текущего пользователя */
    public boolean isBoardInMyDirection(UUID boardId) {
        UUID teamId = principal().getTeamId();
        if (teamId == null) return false;
        UUID myDirectionId = teamRepository.findById(teamId)
                .map(t -> t.getDirectionId())
                .orElse(null);
        if (myDirectionId == null) return false;
        return boardRepository.findById(boardId)
                .map(b -> b.getDirectionId().equals(myDirectionId))
                .orElse(false);
    }

    /** Текущий пользователь является исполнителем данной задачи */
    public boolean isTaskAssignedToMe(UUID taskId) {
        UUID userId = principal().getId();
        return taskRepository.findById(taskId)
                .map(t -> userId.equals(t.getAssigneeId()))
                .orElse(false);
    }

    /** Эпик принадлежит команде текущего пользователя */
    public boolean isEpicMyTeams(UUID epicId) {
        UUID myTeamId = principal().getTeamId();
        if (myTeamId == null) return false;
        return epicRepository.findById(epicId)
                .map(e -> myTeamId.equals(e.getTeamId()))
                .orElse(false);
    }

    /** Эпик задачи принадлежит команде текущего пользователя */
    public boolean isEpicAssignedToMyTeam(UUID taskId) {
        UUID myTeamId = principal().getTeamId();
        if (myTeamId == null) return false;
        return taskRepository.findById(taskId)
                .flatMap(t -> epicRepository.findById(t.getEpicId()))
                .map(e -> myTeamId.equals(e.getTeamId()))
                .orElse(false);
    }

    /** Тимлид может взять эпик: у эпика нет команды, а у пользователя есть команда */
    public boolean canTeamLeadClaimEpic(UUID epicId) {
        UUID myTeamId = principal().getTeamId();
        if (myTeamId == null) return false;
        return epicRepository.findById(epicId)
                .map(e -> e.getTeamId() == null)
                .orElse(false);
    }
}
