package ru.danilshkuratetskiy.kanban.web.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Column;
import ru.danilshkuratetskiy.kanban.domain.service.ColumnService;
import ru.danilshkuratetskiy.kanban.web.dto.entities.ColumnDto;
import ru.danilshkuratetskiy.kanban.web.mapper.ColumnMapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
    public ResponseEntity<ColumnDto> createColumn(@RequestBody ColumnDto dto) {
        Column column = mapper.toDomain(dto);
        Column created = service.create(column);
        return new ResponseEntity<>(mapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ColumnDto> updateColumn(@PathVariable UUID id, @RequestBody ColumnDto dto) {
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
    public ResponseEntity<List<ColumnDto>> getAllColumns() {
        List<ColumnDto> columns = service.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(columns);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteColumn(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
