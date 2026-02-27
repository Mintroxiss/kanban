package ru.danilshkuratetskiy.kanban.domain.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.danilshkuratetskiy.kanban.datasource.entity.BoardEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.EpicEntity;
import ru.danilshkuratetskiy.kanban.datasource.entity.TeamEntity;
import ru.danilshkuratetskiy.kanban.datasource.mapper.EpicEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.mapper.TaskEntityMapper;
import ru.danilshkuratetskiy.kanban.datasource.repository.BoardRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.EpicRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.TaskRepository;
import ru.danilshkuratetskiy.kanban.datasource.repository.TeamRepository;
import ru.danilshkuratetskiy.kanban.domain.model.Epic;
import ru.danilshkuratetskiy.kanban.domain.model.Task;
import ru.danilshkuratetskiy.kanban.domain.service.EpicService;
import ru.danilshkuratetskiy.kanban.domain.service.exception.BoardNotFoundException;
import ru.danilshkuratetskiy.kanban.domain.service.exception.BusinessException;
import ru.danilshkuratetskiy.kanban.domain.service.exception.EpicNotFoundException;
import ru.danilshkuratetskiy.kanban.domain.service.exception.TeamNotFoundException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EpicServiceImpl implements EpicService {

    private final EpicRepository epicRepository;
    private final EpicEntityMapper epicMapper;
    private final TeamRepository teamRepository;
    private final BoardRepository boardRepository;
    private final TaskRepository taskRepository;
    private final TaskEntityMapper taskMapper;

    public EpicServiceImpl(
            EpicRepository epicRepository,
            EpicEntityMapper epicMapper,
            TeamRepository teamRepository,
            BoardRepository boardRepository,
            TaskRepository taskRepository,
            TaskEntityMapper taskMapper
    ) {
        this.epicRepository = epicRepository;
        this.epicMapper = epicMapper;
        this.teamRepository = teamRepository;
        this.boardRepository = boardRepository;
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
    }

    @Override
    @Transactional
    public Epic create(Epic epic) {
        EpicEntity entity = epicMapper.toEntity(epic);
        EpicEntity saved = epicRepository.save(entity);
        return epicMapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Epic update(UUID id, Epic epic) {
        EpicEntity existing = epicRepository.findById(id)
                .orElseThrow(() -> new EpicNotFoundException("Epic not found: " + id));
        existing.setTitle(epic.getTitle());
        existing.setDescription(epic.getDescription());
        existing.setBoardId(epic.getBoardId());
        existing.setTeamId(epic.getTeamId());
        EpicEntity updated = epicRepository.save(existing);
        return epicMapper.toDomain(updated);
    }

    @Override
    @Transactional
    public Epic findById(UUID id) {
        return epicRepository.findById(id)
                .map(epicMapper::toDomain)
                .orElseThrow(() -> new EpicNotFoundException("Epic not found: " + id));
    }

    @Override
    @Transactional
    public List<Epic> findAll() {
        return epicRepository.findAll().stream()
                .map(epicMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Epic> findAll(Pageable pageable) {
        return epicRepository.findAll(pageable).map(epicMapper::toDomain);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!epicRepository.existsById(id)) {
            throw new EpicNotFoundException("Epic not found: " + id);
        }
        epicRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Epic assignTeam(UUID epicId, UUID teamId) {
        EpicEntity epic = epicRepository.findById(epicId)
                .orElseThrow(() -> new EpicNotFoundException("Epic not found"));

        TeamEntity team = teamRepository.findById(teamId)
                .orElseThrow(() -> new TeamNotFoundException("Team not found"));

        BoardEntity board = boardRepository.findById(epic.getBoardId())
                .orElseThrow(() -> new BoardNotFoundException("Board not found"));

        if (!board.getDirectionId().equals(team.getDirectionId())) {
            throw new BusinessException("Team direction does not match epic's board direction");
        }

        epic.setTeamId(teamId);
        EpicEntity saved = epicRepository.save(epic);
        return epicMapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Epic archiveEpic(UUID epicId) {
        EpicEntity entity = epicRepository.findById(epicId)
                .orElseThrow(() -> new EpicNotFoundException("Epic not found: " + epicId));
        entity.setArchived(true);
        return epicMapper.toDomain(epicRepository.save(entity));
    }

    @Override
    @Transactional
    public Epic restoreEpic(UUID epicId) {
        EpicEntity entity = epicRepository.findById(epicId)
                .orElseThrow(() -> new EpicNotFoundException("Epic not found: " + epicId));
        entity.setArchived(false);
        return epicMapper.toDomain(epicRepository.save(entity));
    }

    @Override
    @Transactional
    public void deleteEpicWithTasks(UUID epicId) {
        if (!epicRepository.existsById(epicId)) {
            throw new EpicNotFoundException("Epic not found: " + epicId);
        }
        taskRepository.deleteAllByEpicIdIn(List.of(epicId));
        epicRepository.deleteById(epicId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Epic> findActiveByBoard(UUID boardId) {
        return epicRepository.findAllByBoardIdAndArchivedFalse(boardId).stream()
                .map(epicMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Epic> findArchivedByBoard(UUID boardId) {
        return epicRepository.findAllByBoardIdAndArchivedTrue(boardId).stream()
                .map(epicMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Task> getEpicTasks(UUID epicId) {
        return taskRepository.findAllByEpicId(epicId).stream()
                .map(taskMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> findActiveBoardIdsByTeam(UUID teamId) {
        return epicRepository.findActiveBoardIdsByTeamId(teamId);
    }
}
