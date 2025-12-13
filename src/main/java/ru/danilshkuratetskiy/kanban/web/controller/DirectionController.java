package ru.danilshkuratetskiy.kanban.web.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Direction;
import ru.danilshkuratetskiy.kanban.domain.service.DirectionService;
import ru.danilshkuratetskiy.kanban.web.dto.DirectionDto;
import ru.danilshkuratetskiy.kanban.web.mapper.DirectionMapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/directions")
public class DirectionController {

    private final DirectionService service;
    private final DirectionMapper mapper;

    public DirectionController(DirectionService service, DirectionMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<DirectionDto> createDirection(@RequestBody DirectionDto dto) {
        Direction direction = mapper.toDomain(dto);
        Direction created = service.create(direction);
        return new ResponseEntity<>(mapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DirectionDto> updateDirection(@PathVariable UUID id, @RequestBody DirectionDto dto) {
        Direction direction = mapper.toDomain(dto);
        Direction updated = service.update(id, direction);
        return ResponseEntity.ok(mapper.toDto(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DirectionDto> getDirectionById(@PathVariable UUID id) {
        Direction direction = service.findById(id);
        return ResponseEntity.ok(mapper.toDto(direction));
    }

    @GetMapping
    public ResponseEntity<List<DirectionDto>> getAllDirections() {
        List<DirectionDto> directions = service.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(directions);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDirection(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
