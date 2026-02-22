package ru.danilshkuratetskiy.kanban.web.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Team;
import ru.danilshkuratetskiy.kanban.domain.service.TeamService;
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

    public TeamController(
            TeamService teamService,
            TeamMapper teamMapper,
            UserMapper userMapper,
            EpicMapper epicMapper,
            TaskMapper taskMapper
    ) {
        this.teamService = teamService;
        this.teamMapper = teamMapper;
        this.userMapper = userMapper;
        this.epicMapper = epicMapper;
        this.taskMapper = taskMapper;
    }

    @PostMapping
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<TeamDto> createTeam(@Valid @RequestBody TeamDto dto) {
        Team team = teamMapper.toDomain(dto);
        Team created = teamService.create(team);
        return new ResponseEntity<>(teamMapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<TeamDto> updateTeam(@PathVariable UUID id, @Valid @RequestBody TeamDto dto) {
        Team team = teamMapper.toDomain(dto);
        Team updated = teamService.update(id, team);
        return ResponseEntity.ok(teamMapper.toDto(updated));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<TeamDto> getTeamById(@PathVariable UUID id) {
        Team team = teamService.findById(id);
        return ResponseEntity.ok(teamMapper.toDto(team));
    }

    @GetMapping
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<Page<TeamDto>> getAllTeams(
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(teamService.findAll(pageable).map(teamMapper::toDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<Void> deleteTeam(@PathVariable UUID id) {
        teamService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{teamId}/users")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'TEAM_LEAD')")
    public List<UserDto> getUsers(@PathVariable UUID teamId) {
        return teamService.getTeamUsers(teamId).stream()
                .map(userMapper::toDto)
                .toList();
    }

    @GetMapping("/{teamId}/epics")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'TEAM_LEAD')")
    public List<EpicDto> getEpics(@PathVariable UUID teamId) {
        return teamService.getTeamEpics(teamId).stream()
                .map(epicMapper::toDto)
                .toList();
    }

    @GetMapping("/{teamId}/tasks")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'TEAM_LEAD')")
    public List<TaskDto> getTasks(@PathVariable UUID teamId) {
        return teamService.getTeamTasks(teamId).stream()
                .map(taskMapper::toDto)
                .toList();
    }

    @PutMapping("/{teamId}/users/{userId}")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<UserDto> addUserToTeam(
            @PathVariable UUID teamId,
            @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(userMapper.toDto(teamService.addUserToTeam(teamId, userId)));
    }

    @DeleteMapping("/{teamId}/users/{userId}")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<Void> removeUserFromTeam(
            @PathVariable UUID teamId,
            @PathVariable UUID userId
    ) {
        teamService.removeUserFromTeam(teamId, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{teamId}/lead")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<TeamDto> assignTeamLead(
            @PathVariable UUID teamId,
            @Valid @RequestBody AssignTeamLeadRequest request
    ) {
        return ResponseEntity.ok(teamMapper.toDto(teamService.assignTeamLead(teamId, request.userId())));
    }
}
