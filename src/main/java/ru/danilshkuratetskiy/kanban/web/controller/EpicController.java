package ru.danilshkuratetskiy.kanban.web.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Epic;
import ru.danilshkuratetskiy.kanban.security.UserPrincipal;
import ru.danilshkuratetskiy.kanban.domain.service.EpicService;
import ru.danilshkuratetskiy.kanban.web.dto.entities.EpicDto;
import ru.danilshkuratetskiy.kanban.web.dto.requests.AssignTeamRequest;
import ru.danilshkuratetskiy.kanban.web.mapper.EpicMapper;
import ru.danilshkuratetskiy.kanban.websocket.BoardEventService;

import java.util.UUID;

@RestController
@RequestMapping("/api/epics")
public class EpicController {

    private final EpicService service;
    private final EpicMapper mapper;
    private final BoardEventService boardEventService;

    public EpicController(EpicService service, EpicMapper mapper, BoardEventService boardEventService) {
        this.service = service;
        this.mapper = mapper;
        this.boardEventService = boardEventService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EpicDto> createEpic(@Valid @RequestBody EpicDto dto) {
        Epic epic = mapper.toDomain(dto);
        Epic created = service.create(epic);
        EpicDto result = mapper.toDto(created);
        boardEventService.publishToBoard(result.getBoardId(), "EPIC_CREATED", result);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<EpicDto> updateEpic(@PathVariable UUID id, @Valid @RequestBody EpicDto dto) {
        Epic epic = mapper.toDomain(dto);
        Epic updated = service.update(id, epic);
        EpicDto result = mapper.toDto(updated);
        boardEventService.publishToBoard(result.getBoardId(), "EPIC_UPDATED", result);
        return ResponseEntity.ok(result);
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
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<Void> deleteEpic(@PathVariable UUID id) {
        EpicDto dto = mapper.toDto(service.findById(id));
        service.delete(id);
        boardEventService.publishToBoard(dto.getBoardId(), "EPIC_DELETED", dto);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{epicId}/claim")
    @PreAuthorize("hasRole('TEAM_LEAD') and @accessControl.canTeamLeadClaimEpic(#epicId)")
    public ResponseEntity<EpicDto> claimEpic(
            @PathVariable UUID epicId,
            @AuthenticationPrincipal UserPrincipal principal) {
        EpicDto dto = mapper.toDto(service.assignTeam(epicId, principal.getTeamId()));
        boardEventService.publishToBoard(dto.getBoardId(), "EPIC_UPDATED", dto);
        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/{epicId}/assign-team")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEAD')")
    public ResponseEntity<EpicDto> assignTeam(
            @PathVariable UUID epicId,
            @Valid @RequestBody AssignTeamRequest request
    ) {
        EpicDto dto = mapper.toDto(service.assignTeam(epicId, request.teamId()));
        boardEventService.publishToBoard(dto.getBoardId(), "EPIC_UPDATED", dto);
        return ResponseEntity.ok(dto);
    }
}
