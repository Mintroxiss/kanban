package ru.danilshkuratetskiy.kanban.web.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Board;
import ru.danilshkuratetskiy.kanban.domain.service.BoardService;
import ru.danilshkuratetskiy.kanban.web.dto.BoardDto;
import ru.danilshkuratetskiy.kanban.web.mapper.BoardMapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/boards")
public class BoardController {

    private final BoardService service;
    private final BoardMapper mapper;

    public BoardController(BoardService service, BoardMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<BoardDto> createBoard(@RequestBody BoardDto dto) {
        Board board = mapper.toDomain(dto);
        Board created = service.create(board);
        return new ResponseEntity<>(mapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BoardDto> updateBoard(@PathVariable UUID id, @RequestBody BoardDto dto) {
        Board board = mapper.toDomain(dto);
        Board updated = service.update(id, board);
        return ResponseEntity.ok(mapper.toDto(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoardDto> getBoardById(@PathVariable UUID id) {
        Board board = service.findById(id);
        return ResponseEntity.ok(mapper.toDto(board));
    }

    @GetMapping
    public ResponseEntity<List<BoardDto>> getAllBoards() {
        List<BoardDto> boards = service.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(boards);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
