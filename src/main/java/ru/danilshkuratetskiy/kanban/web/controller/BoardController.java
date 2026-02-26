package ru.danilshkuratetskiy.kanban.web.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.domain.model.Board;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.service.BoardService;
import ru.danilshkuratetskiy.kanban.web.dto.entities.BoardDto;
import ru.danilshkuratetskiy.kanban.web.dto.entities.TaskDto;
import ru.danilshkuratetskiy.kanban.web.mapper.BoardMapper;
import ru.danilshkuratetskiy.kanban.web.mapper.TaskMapper;
import ru.danilshkuratetskiy.kanban.websocket.BoardEventService;

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
    private final BoardEventService boardEventService;

    public BoardController(BoardService boardService, BoardMapper boardMapper,
                           TaskMapper taskMapper, BoardEventService boardEventService) {
        this.boardService = boardService;
        this.boardMapper = boardMapper;
        this.taskMapper = taskMapper;
        this.boardEventService = boardEventService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BoardDto> createBoard(@Valid @RequestBody BoardDto dto) {
        Board board = boardMapper.toDomain(dto);
        Board created = boardService.create(board);
        BoardDto result = boardMapper.toDto(created);
        boardEventService.publishToBoards("BOARD_CREATED", result);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BoardDto> updateBoard(@PathVariable UUID id, @Valid @RequestBody BoardDto dto) {
        Board board = boardMapper.toDomain(dto);
        Board updated = boardService.update(id, board);
        BoardDto result = boardMapper.toDto(updated);
        boardEventService.publishToBoards("BOARD_UPDATED", result);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoardDto> getBoardById(@PathVariable UUID id) {
        Board board = boardService.findById(id);
        return ResponseEntity.ok(boardMapper.toDto(board));
    }

    @GetMapping
    public ResponseEntity<Page<BoardDto>> getAllBoards(
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(boardService.findAll(pageable).map(boardMapper::toDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> archiveBoard(@PathVariable UUID id) {
        BoardDto dto = boardMapper.toDto(boardService.findById(id));
        boardService.archiveBoard(id);
        boardEventService.publishToBoards("BOARD_ARCHIVED", dto);
        boardEventService.publishToBoard(id, "BOARD_ARCHIVED", dto);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/unarchive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BoardDto> unarchiveBoard(@PathVariable UUID id) {
        boardService.unarchiveBoard(id);
        BoardDto result = boardMapper.toDto(boardService.findById(id));
        boardEventService.publishToBoards("BOARD_UNARCHIVED", result);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}/permanent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBoard(@PathVariable UUID id) {
        BoardDto dto = boardMapper.toDto(boardService.findById(id));
        boardService.delete(id);
        boardEventService.publishToBoards("BOARD_DELETED", dto);
        boardEventService.publishToBoard(id, "BOARD_DELETED", dto);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/archived")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<BoardDto>> getArchivedBoards(
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(boardService.findAllArchived(pageable).map(boardMapper::toDto));
    }

    @GetMapping("/{id}/tasks/grouped")
    public ResponseEntity<Map<UUID, List<TaskDto>>> getGroupedTasks(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID epicId
    ) {
        Map<UUID, List<Task>> groupedTasks = boardService.getBoardTasksGroupedByColumns(id, epicId);

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
