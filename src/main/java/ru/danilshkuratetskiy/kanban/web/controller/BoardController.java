package ru.danilshkuratetskiy.kanban.web.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Board;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.service.BoardService;
import ru.danilshkuratetskiy.kanban.web.dto.entities.BoardDto;
import ru.danilshkuratetskiy.kanban.web.dto.entities.TaskDto;
import ru.danilshkuratetskiy.kanban.web.mapper.BoardMapper;
import ru.danilshkuratetskiy.kanban.web.mapper.TaskMapper;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/boards")
public class BoardController {

    private final BoardService boardService;
    private final BoardMapper boardMapper;

    private final TaskMapper taskMapper;

    public BoardController(BoardService boardService, BoardMapper boardMapper, TaskMapper taskMapper) {
        this.boardService = boardService;
        this.boardMapper = boardMapper;
        this.taskMapper = taskMapper;
    }

    @PostMapping
    public ResponseEntity<BoardDto> createBoard(@RequestBody BoardDto dto) {
        Board board = boardMapper.toDomain(dto);
        Board created = boardService.create(board);
        return new ResponseEntity<>(boardMapper.toDto(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BoardDto> updateBoard(@PathVariable UUID id, @RequestBody BoardDto dto) {
        Board board = boardMapper.toDomain(dto);
        Board updated = boardService.update(id, board);
        return ResponseEntity.ok(boardMapper.toDto(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoardDto> getBoardById(@PathVariable UUID id) {
        Board board = boardService.findById(id);
        return ResponseEntity.ok(boardMapper.toDto(board));
    }

    @GetMapping
    public ResponseEntity<List<BoardDto>> getAllBoards() {
        List<BoardDto> boards = boardService.findAll().stream()
                .map(boardMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(boards);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(@PathVariable UUID id) {
        boardService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/tasks/grouped")
    public ResponseEntity<Map<UUID, List<TaskDto>>> getGroupedTasks(@PathVariable UUID id) {
        Map<UUID, List<Task>> groupedTasks = boardService.getBoardTasksGroupedByColumns(id);

        Map<UUID, List<TaskDto>> groupedDtos = groupedTasks.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().stream()
                                .map(taskMapper::toDto)
                                .collect(Collectors.toList())
                ));

        return ResponseEntity.ok(groupedDtos);
    }
}
