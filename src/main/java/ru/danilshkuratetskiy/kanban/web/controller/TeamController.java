package ru.danilshkuratetskiy.kanban.web.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Team;
import ru.danilshkuratetskiy.kanban.domain.service.TeamService;
import ru.danilshkuratetskiy.kanban.web.dto.entities.EpicDto;
import ru.danilshkuratetskiy.kanban.web.dto.entities.TaskDto;
import ru.danilshkuratetskiy.kanban.web.dto.entities.TeamDto;
import ru.danilshkuratetskiy.kanban.web.dto.entities.UserDto;
import ru.danilshkuratetskiy.kanban.web.mapper.EpicMapper;
import ru.danilshkuratetskiy.kanban.web.mapper.TaskMapper;
import ru.danilshkuratetskiy.kanban.web.mapper.TeamMapper;
import ru.danilshkuratetskiy.kanban.web.mapper.UserMapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
    public ResponseEntity<TeamDto> createTeam(@RequestBody TeamDto dto) {
        Team team = teamMapper.toDomain(dto);
        Team created = teamService.create(team);
        return new ResponseEntity<>(teamMapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamDto> updateTeam(@PathVariable UUID id, @RequestBody TeamDto dto) {
        Team team = teamMapper.toDomain(dto);
        Team updated = teamService.update(id, team);
        return ResponseEntity.ok(teamMapper.toDto(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamDto> getTeamById(@PathVariable UUID id) {
        Team team = teamService.findById(id);
        return ResponseEntity.ok(teamMapper.toDto(team));
    }

    @GetMapping
    public ResponseEntity<List<TeamDto>> getAllTeams() {
        List<TeamDto> teams = teamService.findAll().stream()
                .map(teamMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(teams);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable UUID id) {
        teamService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{teamId}/users")
    public List<UserDto> getUsers(@PathVariable UUID teamId) {
        return teamService.getTeamUsers(teamId).stream()
                .map(userMapper::toDto)
                .toList();
    }

    @GetMapping("/{teamId}/epics")
    public List<EpicDto> getEpics(@PathVariable UUID teamId) {
        return teamService.getTeamEpics(teamId).stream()
                .map(epicMapper::toDto)
                .toList();
    }

    @GetMapping("/{teamId}/tasks")
    public List<TaskDto> getTasks(@PathVariable UUID teamId) {
        return teamService.getTeamTasks(teamId).stream()
                .map(taskMapper::toDto)
                .toList();
    }
}
