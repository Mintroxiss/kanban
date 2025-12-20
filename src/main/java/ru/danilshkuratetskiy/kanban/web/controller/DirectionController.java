package ru.danilshkuratetskiy.kanban.web.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Direction;
import ru.danilshkuratetskiy.kanban.domain.service.DirectionService;
import ru.danilshkuratetskiy.kanban.web.dto.entities.BoardDto;
import ru.danilshkuratetskiy.kanban.web.dto.entities.DirectionDto;
import ru.danilshkuratetskiy.kanban.web.dto.entities.TeamDto;
import ru.danilshkuratetskiy.kanban.web.mapper.BoardMapper;
import ru.danilshkuratetskiy.kanban.web.mapper.DirectionMapper;
import ru.danilshkuratetskiy.kanban.web.mapper.TeamMapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/directions")
public class DirectionController {

    private final DirectionService directionService;
    private final DirectionMapper directionMapper;

    private final BoardMapper boardMapper;
    private final TeamMapper teamMapper;

    public DirectionController(
            DirectionService directionService,
            DirectionMapper directionMapper,
            BoardMapper boardMapper,
            TeamMapper teamMapper
    ) {
        this.directionService = directionService;
        this.directionMapper = directionMapper;
        this.boardMapper = boardMapper;
        this.teamMapper = teamMapper;
    }

    @PostMapping
    public ResponseEntity<DirectionDto> createDirection(@RequestBody DirectionDto dto) {
        Direction direction = directionMapper.toDomain(dto);
        Direction created = directionService.create(direction);
        return new ResponseEntity<>(directionMapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DirectionDto> updateDirection(@PathVariable UUID id, @RequestBody DirectionDto dto) {
        Direction direction = directionMapper.toDomain(dto);
        Direction updated = directionService.update(id, direction);
        return ResponseEntity.ok(directionMapper.toDto(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DirectionDto> getDirectionById(@PathVariable UUID id) {
        Direction direction = directionService.findById(id);
        return ResponseEntity.ok(directionMapper.toDto(direction));
    }

    @GetMapping
    public ResponseEntity<List<DirectionDto>> getAllDirections() {
        List<DirectionDto> directions = directionService.findAll().stream()
                .map(directionMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(directions);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDirection(@PathVariable UUID id) {
        directionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Возвращает все доски направления
     */
    @GetMapping("/{directionId}/boards")
    public List<BoardDto> getBoards(@PathVariable UUID directionId) {
        return directionService.getBoards(directionId).stream()
                .map(boardMapper::toDto)
                .toList();
    }

    /**
     * Возвращает все команды направления
     */
    @GetMapping("/{directionId}/teams")
    public List<TeamDto> getTeams(@PathVariable UUID directionId) {
        return directionService.getTeams(directionId).stream()
                .map(teamMapper::toDto)
                .toList();
    }
}
