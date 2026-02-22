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

import java.util.UUID;

@RestController
@RequestMapping("/api/columns")
public class ColumnController {

    private final ColumnService service;
    private final ColumnMapper mapper;

    public ColumnController(ColumnService service, ColumnMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<ColumnDto> createColumn(@Valid @RequestBody ColumnDto dto) {
        Column column = mapper.toDomain(dto);
        Column created = service.create(column);
        return new ResponseEntity<>(mapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<ColumnDto> updateColumn(@PathVariable UUID id, @Valid @RequestBody ColumnDto dto) {
        Column column = mapper.toDomain(dto);
        Column updated = service.update(id, column);
        return ResponseEntity.ok(mapper.toDto(updated));
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
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<Void> deleteColumn(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
