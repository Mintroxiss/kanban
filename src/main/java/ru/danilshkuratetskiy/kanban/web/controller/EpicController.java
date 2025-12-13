package ru.danilshkuratetskiy.kanban.web.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Epic;
import ru.danilshkuratetskiy.kanban.domain.service.EpicService;
import ru.danilshkuratetskiy.kanban.web.dto.EpicDto;
import ru.danilshkuratetskiy.kanban.web.mapper.EpicMapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
    public ResponseEntity<EpicDto> createEpic(@RequestBody EpicDto dto) {
        Epic epic = mapper.toDomain(dto);
        Epic created = service.create(epic);
        return new ResponseEntity<>(mapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EpicDto> updateEpic(@PathVariable UUID id, @RequestBody EpicDto dto) {
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
    public ResponseEntity<List<EpicDto>> getAllEpics() {
        List<EpicDto> epics = service.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(epics);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEpic(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
