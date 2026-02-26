package ru.danilshkuratetskiy.kanban.datasource.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(name = "epics")
public class EpicEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "board_id", nullable = false)
    private UUID boardId;

    @Column(name = "team_id")
    private UUID teamId;

    @Column(nullable = false)
    private boolean archived;
}
