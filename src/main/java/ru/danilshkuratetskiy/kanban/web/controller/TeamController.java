package ru.danilshkuratetskiy.kanban.web.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Team;
import ru.danilshkuratetskiy.kanban.domain.service.TeamService;
import ru.danilshkuratetskiy.kanban.web.dto.entities.TeamDto;
import ru.danilshkuratetskiy.kanban.web.mapper.TeamMapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService service;
    private final TeamMapper mapper;

    public TeamController(TeamService service, TeamMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<TeamDto> createTeam(@RequestBody TeamDto dto) {
        Team team = mapper.toDomain(dto);
        Team created = service.create(team);
        return new ResponseEntity<>(mapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamDto> updateTeam(@PathVariable UUID id, @RequestBody TeamDto dto) {
        Team team = mapper.toDomain(dto);
        Team updated = service.update(id, team);
        return ResponseEntity.ok(mapper.toDto(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamDto> getTeamById(@PathVariable UUID id) {
        Team team = service.findById(id);
        return ResponseEntity.ok(mapper.toDto(team));
    }

    @GetMapping
    public ResponseEntity<List<TeamDto>> getAllTeams() {
        List<TeamDto> teams = service.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(teams);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
