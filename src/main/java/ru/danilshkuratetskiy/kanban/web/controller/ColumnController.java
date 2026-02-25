package ru.danilshkuratetskiy.kanban.web.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Column;
import ru.danilshkuratetskiy.kanban.domain.service.ColumnService;
import ru.danilshkuratetskiy.kanban.web.dto.entities.ColumnDto;
import ru.danilshkuratetskiy.kanban.web.mapper.ColumnMapper;
import ru.danilshkuratetskiy.kanban.websocket.BoardEventService;

import java.util.UUID;

@RestController
@RequestMapping("/api/columns")
public class ColumnController {

    private final ColumnService service;
    private final ColumnMapper mapper;
    private final BoardEventService boardEventService;

    public ColumnController(ColumnService service, ColumnMapper mapper, BoardEventService boardEventService) {
        this.service = service;
        this.mapper = mapper;
        this.boardEventService = boardEventService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ColumnDto> createColumn(@Valid @RequestBody ColumnDto dto) {
        Column column = mapper.toDomain(dto);
        Column created = service.create(column);
        ColumnDto result = mapper.toDto(created);
        boardEventService.publishToBoard(result.getBoardId(), "COLUMN_CREATED", result);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ColumnDto> updateColumn(@PathVariable UUID id, @Valid @RequestBody ColumnDto dto) {
        Column column = mapper.toDomain(dto);
        Column updated = service.update(id, column);
        ColumnDto result = mapper.toDto(updated);
        boardEventService.publishToBoard(result.getBoardId(), "COLUMN_UPDATED", result);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ColumnDto> getColumnById(@PathVariable UUID id) {
        Column column = service.findById(id);
        return ResponseEntity.ok(mapper.toDto(column));
    }

    @GetMapping
    public ResponseEntity<Page<ColumnDto>> getAllColumns(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable).map(mapper::toDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteColumn(@PathVariable UUID id) {
        ColumnDto dto = mapper.toDto(service.findById(id));
        service.delete(id);
        boardEventService.publishToBoard(dto.getBoardId(), "COLUMN_DELETED", dto);
        return ResponseEntity.noContent().build();
    }
}
