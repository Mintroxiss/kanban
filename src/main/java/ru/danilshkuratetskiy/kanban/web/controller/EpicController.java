package ru.danilshkuratetskiy.kanban.web.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Epic;
import ru.danilshkuratetskiy.kanban.domain.service.EpicService;
import ru.danilshkuratetskiy.kanban.web.dto.entities.EpicDto;
import ru.danilshkuratetskiy.kanban.web.dto.requests.AssignTeamRequest;
import ru.danilshkuratetskiy.kanban.web.mapper.EpicMapper;

import java.util.UUID;

@RestController
@RequestMapping("/api/epics")
public class EpicController {

    private final EpicService service;
    private final EpicMapper mapper;

    public EpicController(EpicService service, EpicMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    @PreAuthorize("hasRole('PROJECT_MANAGER') or (hasRole('TEAM_LEAD') and @accessControl.isBoardInMyDirection(#dto.boardId))")
    public ResponseEntity<EpicDto> createEpic(@Valid @RequestBody EpicDto dto) {
        Epic epic = mapper.toDomain(dto);
        Epic created = service.create(epic);
        return new ResponseEntity<>(mapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<EpicDto> updateEpic(@PathVariable UUID id, @Valid @RequestBody EpicDto dto) {
        Epic epic = mapper.toDomain(dto);
        Epic updated = service.update(id, epic);
        return ResponseEntity.ok(mapper.toDto(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EpicDto> getEpicById(@PathVariable UUID id) {
        Epic epic = service.findById(id);
        return ResponseEntity.ok(mapper.toDto(epic));
    }

    @GetMapping
    public ResponseEntity<Page<EpicDto>> getAllEpics(
            @PageableDefault(size = 20, sort = "title") Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable).map(mapper::toDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<Void> deleteEpic(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{epicId}/assign-team")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<EpicDto> assignTeam(
            @PathVariable UUID epicId,
            @Valid @RequestBody AssignTeamRequest request
    ) {
        EpicDto dto = mapper.toDto(service.assignTeam(epicId, request.teamId()));
        return ResponseEntity.ok(dto);
    }
}
