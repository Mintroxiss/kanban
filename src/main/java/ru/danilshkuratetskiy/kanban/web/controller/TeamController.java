package ru.danilshkuratetskiy.kanban.web.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Team;
import ru.danilshkuratetskiy.kanban.domain.model.User;
import ru.danilshkuratetskiy.kanban.domain.service.TeamService;
import ru.danilshkuratetskiy.kanban.domain.service.UserService;
import ru.danilshkuratetskiy.kanban.web.dto.entities.EpicDto;
import ru.danilshkuratetskiy.kanban.web.dto.entities.TaskDto;
import ru.danilshkuratetskiy.kanban.web.dto.entities.TeamDto;
import ru.danilshkuratetskiy.kanban.web.dto.entities.UserDto;
import ru.danilshkuratetskiy.kanban.web.dto.requests.AssignTeamLeadRequest;
import ru.danilshkuratetskiy.kanban.web.mapper.EpicMapper;
import ru.danilshkuratetskiy.kanban.web.mapper.TaskMapper;
import ru.danilshkuratetskiy.kanban.web.mapper.TeamMapper;
import ru.danilshkuratetskiy.kanban.web.mapper.UserMapper;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;
    private final TeamMapper teamMapper;
    private final UserMapper userMapper;
    private final EpicMapper epicMapper;
    private final TaskMapper taskMapper;
    private final UserService userService;

    public TeamController(
            TeamService teamService,
            TeamMapper teamMapper,
            UserMapper userMapper,
            EpicMapper epicMapper,
            TaskMapper taskMapper,
            UserService userService
    ) {
        this.teamService = teamService;
        this.teamMapper = teamMapper;
        this.userMapper = userMapper;
        this.epicMapper = epicMapper;
        this.taskMapper = taskMapper;
        this.userService = userService;
    }

    private void assertTeamAccess(UUID teamId, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            User currentUser = userService.findByEmail(authentication.getName());
            if (!teamId.equals(currentUser.getTeamId())) {
                throw new AccessDeniedException("You can only manage your own team");
            }
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeamDto> createTeam(@Valid @RequestBody TeamDto dto) {
        Team team = teamMapper.toDomain(dto);
        Team created = teamService.create(team);
        return new ResponseEntity<>(teamMapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeamDto> updateTeam(@PathVariable UUID id, @Valid @RequestBody TeamDto dto) {
        Team team = teamMapper.toDomain(dto);
        Team updated = teamService.update(id, team);
        return ResponseEntity.ok(teamMapper.toDto(updated));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<TeamDto> getTeamById(@PathVariable UUID id) {
        Team team = teamService.findById(id);
        return ResponseEntity.ok(teamMapper.toDto(team));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<TeamDto>> getAllTeams(
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(teamService.findAll(pageable).map(teamMapper::toDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTeam(@PathVariable UUID id) {
        teamService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{teamId}/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public List<UserDto> getUsers(@PathVariable UUID teamId) {
        return teamService.getTeamUsers(teamId).stream()
                .map(userMapper::toDto)
                .toList();
    }

    @GetMapping("/{teamId}/epics")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public List<EpicDto> getEpics(@PathVariable UUID teamId) {
        return teamService.getTeamEpics(teamId).stream()
                .map(epicMapper::toDto)
                .toList();
    }

    @GetMapping("/{teamId}/tasks")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public List<TaskDto> getTasks(@PathVariable UUID teamId) {
        return teamService.getTeamTasks(teamId).stream()
                .map(taskMapper::toDto)
                .toList();
    }

    @PutMapping("/{teamId}/users/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<UserDto> addUserToTeam(
            @PathVariable UUID teamId,
            @PathVariable UUID userId,
            Authentication authentication
    ) {
        assertTeamAccess(teamId, authentication);
        return ResponseEntity.ok(userMapper.toDto(teamService.addUserToTeam(teamId, userId)));
    }

    @DeleteMapping("/{teamId}/users/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<Void> removeUserFromTeam(
            @PathVariable UUID teamId,
            @PathVariable UUID userId,
            Authentication authentication
    ) {
        assertTeamAccess(teamId, authentication);
        teamService.removeUserFromTeam(teamId, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{teamId}/lead")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<TeamDto> assignTeamLead(
            @PathVariable UUID teamId,
            @Valid @RequestBody AssignTeamLeadRequest request,
            Authentication authentication
    ) {
        assertTeamAccess(teamId, authentication);
        return ResponseEntity.ok(teamMapper.toDto(teamService.assignTeamLead(teamId, request.userId())));
    }
}
